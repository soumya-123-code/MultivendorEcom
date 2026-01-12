"""
Product service for business logic.
"""
import logging
from django.db import transaction
from django.utils import timezone

from apps.products.models import Product, ProductVariant, Category
from apps.vendors.models import Vendor
from core.utils.constants import ProductStatus
from core.utils.helpers import slugify_unique
from core.exceptions import NotFoundError, ValidationException, PermissionDeniedError

logger = logging.getLogger(__name__)


class ProductService:
    """Service class for product operations."""
    
    @staticmethod
    def get_product_by_id(product_id: int, vendor: Vendor = None) -> Product:
        """Get product by ID."""
        try:
            queryset = Product.objects.select_related('vendor', 'category')
            if vendor:
                queryset = queryset.filter(vendor=vendor)
            return queryset.get(id=product_id)
        except Product.DoesNotExist:
            raise NotFoundError(f"Product with ID {product_id} not found.")
    
    @staticmethod
    def get_product_by_slug(vendor_slug: str, product_slug: str) -> Product:
        """Get product by vendor and product slug."""
        try:
            return Product.objects.select_related('vendor', 'category').get(
                vendor__store_slug=vendor_slug,
                slug=product_slug
            )
        except Product.DoesNotExist:
            raise NotFoundError(f"Product not found.")
    
    @staticmethod
    @transaction.atomic
    def create_product(vendor: Vendor, **kwargs) -> Product:
        """
        Create a new product.
        
        Args:
            vendor: Vendor creating the product
            **kwargs: Product fields
        
        Returns:
            Created product instance
        """
        # Generate unique slug
        name = kwargs.get('name')
        if not name:
            raise ValidationException("Product name is required.")
        
        kwargs['slug'] = slugify_unique(name, Product, 'slug')
        kwargs['vendor'] = vendor
        
        # Validate category belongs to vendor or is global
        category = kwargs.get('category')
        if category:
            if category.vendor and category.vendor != vendor:
                raise PermissionDeniedError("Cannot use another vendor's category.")
        
        product = Product.objects.create(**kwargs)
        
        # Update vendor product count
        vendor.total_products = Product.objects.filter(
            vendor=vendor, is_active=True
        ).count()
        vendor.save(update_fields=['total_products'])
        
        logger.info(f"Product created: {product.name} by {vendor.store_name}")
        
        return product
    
    @staticmethod
    def update_product(product: Product, **kwargs) -> Product:
        """Update product."""
        for field, value in kwargs.items():
            if hasattr(product, field) and field not in ['vendor', 'sku', 'slug']:
                setattr(product, field, value)
        
        product.save()
        logger.info(f"Product updated: {product.name}")
        
        return product
    
    @staticmethod
    def publish_product(product: Product) -> Product:
        """Publish a product."""
        if product.status == ProductStatus.ACTIVE:
            raise ValidationException("Product is already published.")
        
        product.status = ProductStatus.ACTIVE
        product.published_at = timezone.now()
        product.save(update_fields=['status', 'published_at'])
        
        logger.info(f"Product published: {product.name}")
        
        return product
    
    @staticmethod
    def unpublish_product(product: Product) -> Product:
        """Unpublish a product."""
        product.status = ProductStatus.INACTIVE
        product.save(update_fields=['status'])
        
        logger.info(f"Product unpublished: {product.name}")
        
        return product
    
    @staticmethod
    def archive_product(product: Product) -> Product:
        """Archive a product."""
        product.status = ProductStatus.ARCHIVED
        product.is_active = False
        product.save(update_fields=['status', 'is_active'])
        
        logger.info(f"Product archived: {product.name}")
        
        return product
    
    @staticmethod
    @transaction.atomic
    def add_variant(product: Product, **kwargs) -> ProductVariant:
        """Add a variant to product."""
        kwargs['product'] = product
        variant = ProductVariant.objects.create(**kwargs)
        
        logger.info(f"Variant added to product: {product.name}")
        
        return variant
    
    @staticmethod
    def get_products_for_vendor(vendor: Vendor, include_inactive: bool = False):
        """Get all products for a vendor."""
        queryset = Product.objects.filter(vendor=vendor)
        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        return queryset.select_related('category')
    
    @staticmethod
    def get_public_products():
        """Get all active, published products."""
        return Product.objects.filter(
            status=ProductStatus.ACTIVE,
            is_active=True,
            vendor__status='approved'
        ).select_related('vendor', 'category')


class CategoryService:
    """Service class for category operations."""
    
    @staticmethod
    def get_category_by_id(category_id: int) -> Category:
        """Get category by ID."""
        try:
            return Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise NotFoundError(f"Category with ID {category_id} not found.")
    
    @staticmethod
    def get_category_by_slug(slug: str) -> Category:
        """Get category by slug."""
        try:
            return Category.objects.get(slug=slug)
        except Category.DoesNotExist:
            raise NotFoundError(f"Category with slug '{slug}' not found.")
    
    @staticmethod
    def create_category(vendor: Vendor = None, **kwargs) -> Category:
        """Create a new category."""
        kwargs['vendor'] = vendor
        
        # Generate unique slug if not provided
        if 'slug' not in kwargs:
            kwargs['slug'] = slugify_unique(kwargs['name'], Category, 'slug')
        
        category = Category.objects.create(**kwargs)
        
        logger.info(f"Category created: {category.name}")
        
        return category
    
    @staticmethod
    def get_root_categories(vendor: Vendor = None):
        """Get root (top-level) categories."""
        queryset = Category.objects.filter(parent__isnull=True, is_active=True)
        if vendor:
            queryset = queryset.filter(models.Q(vendor=vendor) | models.Q(vendor__isnull=True))
        else:
            queryset = queryset.filter(vendor__isnull=True)
        return queryset.order_by('display_order')
    
    @staticmethod
    def get_category_tree(vendor: Vendor = None):
        """Get full category tree."""
        root_categories = CategoryService.get_root_categories(vendor)
        return root_categories

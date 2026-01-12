"""
Vendor service for business logic.
"""
import logging
from django.db import transaction
from django.utils import timezone

from apps.vendors.models import Vendor, Supplier
from apps.accounts.models import User
from core.utils.choices import RoleChoices
from core.utils.constants import VendorStatus
from core.utils.helpers import slugify_unique
from core.exceptions import (
    NotFoundError,
    ValidationException,
    PermissionDeniedError,
    BusinessLogicError
)

logger = logging.getLogger(__name__)


class VendorService:
    """Service class for vendor operations."""
    
    @staticmethod
    def get_vendor_by_id(vendor_id: int) -> Vendor:
        """Get vendor by ID."""
        try:
            return Vendor.objects.select_related('user').get(id=vendor_id)
        except Vendor.DoesNotExist:
            raise NotFoundError(f"Vendor with ID {vendor_id} not found.")
    
    @staticmethod
    def get_vendor_by_slug(slug: str) -> Vendor:
        """Get vendor by slug."""
        try:
            return Vendor.objects.select_related('user').get(store_slug=slug)
        except Vendor.DoesNotExist:
            raise NotFoundError(f"Vendor with slug '{slug}' not found.")
    
    @staticmethod
    @transaction.atomic
    def create_vendor(user: User, **kwargs) -> Vendor:
        """
        Create a new vendor profile for a user.
        
        Args:
            user: User to become vendor
            **kwargs: Vendor fields
        
        Returns:
            Created vendor instance
        """
        # Check if user already has a vendor profile
        if hasattr(user, 'vendor'):
            raise ValidationException("User already has a vendor profile.")
        
        # Generate slug from store name
        store_name = kwargs.get('store_name')
        if not store_name:
            raise ValidationException("Store name is required.")
        
        kwargs['store_slug'] = slugify_unique(store_name, Vendor, 'store_slug')
        kwargs['user'] = user
        
        # Create vendor
        vendor = Vendor.objects.create(**kwargs)
        
        # Update user role to vendor
        user.role = RoleChoices.VENDOR
        user.save(update_fields=['role'])
        
        logger.info(f"Vendor created: {vendor.store_name} by {user.email}")
        
        return vendor
    
    @staticmethod
    def update_vendor(vendor: Vendor, **kwargs) -> Vendor:
        """Update vendor profile."""
        for field, value in kwargs.items():
            if hasattr(vendor, field) and field not in ['user', 'store_slug', 'status']:
                setattr(vendor, field, value)
        
        vendor.save()
        logger.info(f"Vendor updated: {vendor.store_name}")
        
        return vendor
    
    @staticmethod
    def approve_vendor(vendor: Vendor, approved_by: User) -> Vendor:
        """Approve a vendor."""
        if vendor.status != VendorStatus.PENDING:
            raise BusinessLogicError(
                f"Cannot approve vendor with status '{vendor.status}'."
            )
        
        vendor.status = VendorStatus.APPROVED
        vendor.approved_by = approved_by
        vendor.approved_at = timezone.now()
        vendor.save(update_fields=['status', 'approved_by', 'approved_at'])
        
        logger.info(f"Vendor approved: {vendor.store_name} by {approved_by.email}")
        
        return vendor
    
    @staticmethod
    def reject_vendor(vendor: Vendor, reason: str, rejected_by: User) -> Vendor:
        """Reject a vendor."""
        if vendor.status != VendorStatus.PENDING:
            raise BusinessLogicError(
                f"Cannot reject vendor with status '{vendor.status}'."
            )
        
        vendor.status = VendorStatus.REJECTED
        vendor.rejection_reason = reason
        vendor.save(update_fields=['status', 'rejection_reason'])
        
        logger.info(f"Vendor rejected: {vendor.store_name} by {rejected_by.email}")
        
        return vendor
    
    @staticmethod
    def suspend_vendor(vendor: Vendor, suspended_by: User) -> Vendor:
        """Suspend a vendor."""
        if vendor.status == VendorStatus.SUSPENDED:
            raise BusinessLogicError("Vendor is already suspended.")
        
        vendor.status = VendorStatus.SUSPENDED
        vendor.save(update_fields=['status'])
        
        logger.info(f"Vendor suspended: {vendor.store_name} by {suspended_by.email}")
        
        return vendor
    
    @staticmethod
    def reactivate_vendor(vendor: Vendor, reactivated_by: User) -> Vendor:
        """Reactivate a suspended vendor."""
        if vendor.status != VendorStatus.SUSPENDED:
            raise BusinessLogicError("Only suspended vendors can be reactivated.")
        
        vendor.status = VendorStatus.APPROVED
        vendor.save(update_fields=['status'])
        
        logger.info(f"Vendor reactivated: {vendor.store_name} by {reactivated_by.email}")
        
        return vendor
    
    @staticmethod
    def get_vendor_stats(vendor: Vendor) -> dict:
        """Get vendor statistics."""
        from apps.products.models import Product
        from apps.sales_orders.models import SalesOrder
        
        total_products = Product.objects.filter(vendor=vendor, is_active=True).count()
        total_orders = SalesOrder.objects.filter(vendor=vendor).count()
        
        return {
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': vendor.total_revenue,
            'rating': vendor.rating,
        }


class SupplierService:
    """Service class for supplier operations."""
    
    @staticmethod
    def get_supplier_by_id(supplier_id: int, vendor: Vendor = None) -> Supplier:
        """Get supplier by ID."""
        try:
            queryset = Supplier.objects.all()
            if vendor:
                queryset = queryset.filter(vendor=vendor)
            return queryset.get(id=supplier_id)
        except Supplier.DoesNotExist:
            raise NotFoundError(f"Supplier with ID {supplier_id} not found.")
    
    @staticmethod
    def create_supplier(vendor: Vendor, **kwargs) -> Supplier:
        """Create a new supplier."""
        kwargs['vendor'] = vendor
        supplier = Supplier.objects.create(**kwargs)
        logger.info(f"Supplier created: {supplier.name} for {vendor.store_name}")
        return supplier
    
    @staticmethod
    def update_supplier(supplier: Supplier, **kwargs) -> Supplier:
        """Update supplier details."""
        for field, value in kwargs.items():
            if hasattr(supplier, field) and field != 'vendor':
                setattr(supplier, field, value)
        supplier.save()
        return supplier
    
    @staticmethod
    def get_suppliers_for_vendor(vendor: Vendor):
        """Get all suppliers for a vendor."""
        return Supplier.objects.filter(vendor=vendor, is_active=True)

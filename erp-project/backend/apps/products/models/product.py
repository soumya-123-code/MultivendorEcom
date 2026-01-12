"""
Product models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.constants import ProductStatus


class Product(BaseModel):
    """
    Product model for e-commerce catalog.
    """
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        'products.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    
    # Basic Info
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    
    # Description
    short_description = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    highlights = models.JSONField(blank=True, null=True, help_text='List of highlights')
    specifications = models.JSONField(blank=True, null=True)
    
    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Tax
    TAX_CLASS_CHOICES = [
        ('standard', 'Standard'),
        ('reduced', 'Reduced'),
        ('zero', 'Zero'),
        ('exempt', 'Exempt'),
    ]
    tax_class = models.CharField(max_length=50, choices=TAX_CLASS_CHOICES, default='standard')
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    hsn_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Physical
    weight = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True,
        help_text='Weight in kg'
    )
    dimensions = models.JSONField(
        blank=True,
        null=True,
        help_text='{"length": ..., "width": ..., "height": ...}'
    )
    
    # Inventory
    track_inventory = models.BooleanField(default=True)
    allow_backorder = models.BooleanField(default=False)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    
    # Media
    images = models.JSONField(blank=True, null=True, help_text='Array of image objects')
    videos = models.JSONField(blank=True, null=True)
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    meta_keywords = models.JSONField(blank=True, null=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.CHOICES,
        default=ProductStatus.DRAFT,
        db_index=True
    )
    is_featured = models.BooleanField(default=False)
    
    # Analytics
    view_count = models.PositiveIntegerField(default=0)
    order_count = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'product'
        verbose_name_plural = 'products'
        ordering = ['-created_at']
        unique_together = ['vendor', 'slug']
        indexes = [
            models.Index(fields=['vendor']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['sku']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage."""
        if self.compare_at_price and self.compare_at_price > self.selling_price:
            discount = ((self.compare_at_price - self.selling_price) / self.compare_at_price) * 100
            return round(discount, 0)
        return 0
    
    @property
    def primary_image(self):
        """Get primary product image."""
        if self.images and len(self.images) > 0:
            return self.images[0]
        return None
    
    def increment_view_count(self):
        """Increment product view count."""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def update_rating(self):
        """Update product rating from reviews."""
        from django.db.models import Avg
        avg_rating = self.reviews.filter(is_approved=True).aggregate(
            avg=Avg('rating')
        )['avg']
        
        self.rating = avg_rating or 0
        self.review_count = self.reviews.filter(is_approved=True).count()
        self.save(update_fields=['rating', 'review_count'])


class ProductVariant(BaseModel):
    """
    Product variant model for products with multiple options.
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    
    name = models.CharField(max_length=255, help_text='e.g., "Red - XL"')
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    
    # Variant attributes
    attributes = models.JSONField(
        help_text='{"color": "Red", "size": "XL"}'
    )
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Physical
    weight = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    dimensions = models.JSONField(blank=True, null=True)
    
    # Media
    image = models.JSONField(blank=True, null=True)
    
    # Order
    position = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = 'product variant'
        verbose_name_plural = 'product variants'
        ordering = ['position', 'name']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"


class ProductImage(BaseModel):
    """
    Product image model for additional images.
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='product_images'
    )
    
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'product image'
        verbose_name_plural = 'product images'
        ordering = ['position']
    
    def __str__(self):
        return f"Image for {self.product.name}"

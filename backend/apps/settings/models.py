"""
Settings models for e-commerce store.
"""
from django.db import models
from core.models import BaseModel
from django.conf import settings


class StoreSettings(BaseModel):
    """General store settings."""
    store_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    
    # Admin notifications
    admin_notification_email = models.EmailField()
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    
    # Social
    facebook_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    
    # Logo and branding
    logo = models.JSONField(blank=True, null=True)
    favicon = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Store Settings'
        verbose_name_plural = 'Store Settings'
    
    def __str__(self):
        return self.store_name


class CurrencySettings(BaseModel):
    """Currency configuration."""
    code = models.CharField(max_length=3, unique=True)  # USD, EUR, INR
    symbol = models.CharField(max_length=10)  # $, €, ₹
    name = models.CharField(max_length=50)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    is_default = models.BooleanField(default=False)
    decimal_separator = models.CharField(max_length=1, default='.')
    thousand_separator = models.CharField(max_length=1, default=',')
    decimal_places = models.PositiveSmallIntegerField(default=2)
    
    class Meta:
        verbose_name = 'Currency'
        verbose_name_plural = 'Currencies'
        ordering = ['-is_default', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            CurrencySettings.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class StoreLocation(BaseModel):
    """Physical store locations."""
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    
    # Coordinates for map
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Timing
    opening_hours = models.JSONField(
        blank=True, 
        null=True,
        help_text='{"monday": "9:00-18:00", "tuesday": "9:00-18:00", ...}'
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Store Location'
        verbose_name_plural = 'Store Locations'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class InvoiceSettings(BaseModel):
    """Invoice configuration."""
    company_details = models.TextField(help_text="Company details to display on invoice")
    invoice_number_prefix = models.CharField(max_length=10, default="INV-")
    invoice_number_digits = models.PositiveSmallIntegerField(default=6)
    font_family = models.CharField(max_length=50, default="Helvetica")
    header_color = models.CharField(max_length=20, default="#000000")
    footer_text = models.TextField(blank=True, null=True)
    show_logo = models.BooleanField(default=True)
    
    # Stamp/Seal
    signature_image = models.JSONField(blank=True, null=True)
    seal_image = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Invoice Settings'
        verbose_name_plural = 'Invoice Settings'

    def __str__(self):
        return "Invoice Configuration"


class TaxSettings(BaseModel):
    """Tax configuration."""
    name = models.CharField(max_length=100)  # VAT, GST, Sales Tax
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    
    # Display options
    show_tax_in_checkout = models.BooleanField(default=True)
    show_tax_in_invoice = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Tax Rule'
        verbose_name_plural = 'Tax Rules'
    
    def __str__(self):
        return f"{self.name} ({self.percentage}%)"


class ShippingMethod(BaseModel):
    """Shipping rules and configuration."""
    name = models.CharField(max_length=100)  # Standard, Express, Free
    min_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_order_value = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    base_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Changed from shipping_cost to base_rate to match view
    rate_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Added for view compatibility
    max_weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True) # Added for view compatibility
    free_shipping_threshold = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True) # Added for view compatibility
    available_countries = models.JSONField(default=list, blank=True) # Added for view compatibility
    
    estimated_days = models.PositiveSmallIntegerField(default=3)
    min_delivery_days = models.PositiveSmallIntegerField(default=2)
    max_delivery_days = models.PositiveSmallIntegerField(default=5)
    
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    
    class Meta:
        verbose_name = 'Shipping Method'
        verbose_name_plural = 'Shipping Methods'
        ordering = ['display_order']
    
    def __str__(self):
        return self.name


class ReturnPolicy(BaseModel):
    """Return policy configuration."""
    name = models.CharField(max_length=100)
    description = models.TextField()
    return_window_days = models.PositiveIntegerField(default=30)
    requires_approval = models.BooleanField(default=True)
    requires_receipt = models.BooleanField(default=True)
    refund_original_shipping = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Return Policy'
        verbose_name_plural = 'Return Policies'
    
    def __str__(self):
        return self.name


class ProductComparison(BaseModel):
    """User product comparison list."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comparisons')
    products = models.ManyToManyField('products.Product', related_name='comparisons')
    
    class Meta:
        verbose_name = 'Product Comparison'
        verbose_name_plural = 'Product Comparisons'
    
    def __str__(self):
        return f"Comparison for {self.user}"


class CheckoutSettings(BaseModel):
    """Checkout configuration."""
    allow_guest_checkout = models.BooleanField(default=True)
    require_phone_number = models.BooleanField(default=True)
    require_email_verification = models.BooleanField(default=False)
    
    min_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_order_quantity = models.PositiveIntegerField(blank=True, null=True)
    
    terms_and_conditions_link = models.URLField(blank=True, null=True)
    require_terms_agreement = models.BooleanField(default=True)
    
    allowed_countries = models.JSONField(default=list, help_text="List of allowed country codes")
    
    class Meta:
        verbose_name = 'Checkout Settings'
        verbose_name_plural = 'Checkout Settings'

    def __str__(self):
        return "Checkout Configuration"

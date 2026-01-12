"""
Customer models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.choices import AddressTypeChoices


class Customer(BaseModel):
    """Customer profile linked to user."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer'
    )
    
    # Loyalty
    loyalty_points = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.PositiveIntegerField(default=0)
    
    # Preferences
    preferred_payment_method = models.CharField(max_length=50, blank=True, null=True)
    marketing_consent = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'customer'
        verbose_name_plural = 'customers'
    
    def __str__(self):
        return self.user.email


class CustomerAddress(BaseModel):
    """Customer shipping/billing address."""
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='addresses'
    )
    
    address_type = models.CharField(
        max_length=20,
        choices=AddressTypeChoices.CHOICES,
        default=AddressTypeChoices.SHIPPING
    )
    label = models.CharField(max_length=50, blank=True, null=True)  # Home, Office
    
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=20)
    landmark = models.CharField(max_length=255, blank=True, null=True)
    
    is_default = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'customer address'
        verbose_name_plural = 'customer addresses'
    
    def __str__(self):
        return f"{self.label or self.address_type} - {self.customer.user.email}"
    
    def save(self, *args, **kwargs):
        # If this is default, unset other defaults
        if self.is_default:
            CustomerAddress.objects.filter(
                customer=self.customer,
                address_type=self.address_type,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class Cart(BaseModel):
    """Shopping cart."""
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carts'
    )
    session_id = models.CharField(max_length=255, blank=True, null=True)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    
    class Meta:
        verbose_name = 'cart'
        verbose_name_plural = 'carts'
    
    def __str__(self):
        return f"Cart {self.id} - {self.customer or self.session_id}"
    
    def recalculate(self):
        """Recalculate cart totals."""
        items = self.items.all()
        self.subtotal = sum(item.total_price for item in items)
        self.total = self.subtotal - self.discount_amount + self.tax_amount
        self.save(update_fields=['subtotal', 'total'])


class CartItem(BaseModel):
    """Cart item."""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = 'cart item'
        verbose_name_plural = 'cart items'
        unique_together = ['cart', 'product', 'variant']
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        self.cart.recalculate()


class Wishlist(BaseModel):
    """Customer wishlist."""
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='wishlists'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    
    class Meta:
        verbose_name = 'wishlist item'
        verbose_name_plural = 'wishlist items'
        unique_together = ['customer', 'product']
    
    def __str__(self):
        return f"{self.customer.user.email} - {self.product.name}"

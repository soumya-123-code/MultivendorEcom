"""
Coupon and Promotion models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from django.utils import timezone


class Coupon(BaseModel):
    """
    Coupon/Promo code model.
    """
    COUPON_TYPE_CHOICES = [
        ('percentage', 'Percentage Discount'),
        ('fixed', 'Fixed Amount'),
        ('free_shipping', 'Free Shipping'),
        ('buy_x_get_y', 'Buy X Get Y'),
    ]

    APPLICABILITY_CHOICES = [
        ('all', 'All Products'),
        ('category', 'Specific Categories'),
        ('product', 'Specific Products'),
        ('vendor', 'Specific Vendors'),
        ('brand', 'Specific Brands'),
        ('first_order', 'First Order Only'),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    coupon_type = models.CharField(
        max_length=20,
        choices=COUPON_TYPE_CHOICES,
        default='percentage'
    )

    # Value
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Percentage or fixed amount'
    )

    # Limits
    min_order_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Minimum order value to apply coupon'
    )
    max_discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Maximum discount amount (for percentage type)'
    )

    # Validity
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    # Usage limits
    usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Total times coupon can be used'
    )
    usage_count = models.PositiveIntegerField(default=0)
    per_user_limit = models.PositiveIntegerField(
        default=1,
        help_text='Times a single user can use this coupon'
    )

    # Applicability
    applicability = models.CharField(
        max_length=20,
        choices=APPLICABILITY_CHOICES,
        default='all'
    )

    # Relationships for specific applicability
    applicable_categories = models.ManyToManyField(
        'products.Category',
        blank=True,
        related_name='coupons'
    )
    applicable_products = models.ManyToManyField(
        'products.Product',
        blank=True,
        related_name='coupons'
    )
    applicable_vendors = models.ManyToManyField(
        'vendors.Vendor',
        blank=True,
        related_name='coupons'
    )
    applicable_brands = models.ManyToManyField(
        'products.Brand',
        blank=True,
        related_name='coupons'
    )

    # User targeting
    target_user_ids = models.JSONField(
        blank=True,
        null=True,
        help_text='Specific user IDs who can use this coupon'
    )
    new_users_only = models.BooleanField(
        default=False,
        help_text='Only for users with no previous orders'
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(
        default=True,
        help_text='Show in public coupon listings'
    )

    # Buy X Get Y settings
    buy_quantity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Buy X quantity'
    )
    get_quantity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Get Y free'
    )
    get_product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='free_with_coupons'
    )

    # Metadata
    terms_and_conditions = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'coupon'
        verbose_name_plural = 'coupons'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'valid_from', 'valid_until']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def is_valid(self):
        """Check if coupon is currently valid."""
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from or now > self.valid_until:
            return False
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False
        return True

    def can_use(self, user, cart_total):
        """Check if user can use this coupon."""
        if not self.is_valid:
            return False, "Coupon is not valid"

        if self.min_order_value and cart_total < self.min_order_value:
            return False, f"Minimum order value is ₹{self.min_order_value}"

        # Check per-user limit
        user_usage = CouponUsage.objects.filter(
            coupon=self,
            user=user
        ).count()
        if user_usage >= self.per_user_limit:
            return False, "You have already used this coupon"

        # Check new users only
        if self.new_users_only:
            from apps.sales_orders.models import SalesOrder
            if SalesOrder.objects.filter(customer__user=user).exists():
                return False, "This coupon is for new users only"

        # Check target users
        if self.target_user_ids and user.id not in self.target_user_ids:
            return False, "This coupon is not available for you"

        return True, "Coupon can be applied"

    def calculate_discount(self, cart_total):
        """Calculate discount amount."""
        if self.coupon_type == 'percentage':
            discount = cart_total * (self.value / 100)
            if self.max_discount:
                discount = min(discount, self.max_discount)
        elif self.coupon_type == 'fixed':
            discount = min(self.value, cart_total)
        elif self.coupon_type == 'free_shipping':
            discount = 0  # Handled separately
        else:
            discount = 0

        return discount


class CouponUsage(BaseModel):
    """
    Track coupon usage by users.
    """
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        related_name='usages'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coupon_usages'
    )
    sales_order = models.ForeignKey(
        'sales_orders.SalesOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coupon_usages'
    )

    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'coupon usage'
        verbose_name_plural = 'coupon usages'
        ordering = ['-used_at']
        indexes = [
            models.Index(fields=['coupon', 'user']),
        ]

    def __str__(self):
        return f"{self.coupon.code} used by {self.user.email}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update usage count
        self.coupon.usage_count = CouponUsage.objects.filter(coupon=self.coupon).count()
        self.coupon.save(update_fields=['usage_count'])

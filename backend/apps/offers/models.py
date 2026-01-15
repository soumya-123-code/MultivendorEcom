"""
Offers and Coupons models.
"""
from django.db import models
from django.utils import timezone
from core.models import BaseModel

class Coupon(BaseModel):
    """Discount coupons."""
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    
    discount_type = models.CharField(
        max_length=20,
        choices=[('percentage', 'Percentage'), ('fixed', 'Fixed Amount')],
        default='percentage'
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    
    min_purchase_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    
    usage_limit = models.PositiveIntegerField(blank=True, null=True, help_text="Total number of times this coupon can be used")
    usage_count = models.PositiveIntegerField(default=0)
    
    user_usage_limit = models.PositiveIntegerField(default=1, help_text="Limit per user")
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Coupon'
        verbose_name_plural = 'Coupons'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.code

    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_date > now or self.end_date < now:
            return False
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False
        return True

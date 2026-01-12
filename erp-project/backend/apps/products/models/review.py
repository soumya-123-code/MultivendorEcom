"""
Product Review model.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel


class ProductReview(BaseModel):
    """
    Product review model for customer reviews.
    """
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews'
    )
    order = models.ForeignKey(
        'sales_orders.SalesOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews'
    )
    
    rating = models.PositiveIntegerField(
        help_text='Rating from 1 to 5'
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    review = models.TextField(blank=True, null=True)
    images = models.JSONField(blank=True, null=True)
    
    # Verification
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    
    # Engagement
    helpful_count = models.PositiveIntegerField(default=0)
    
    # Moderation
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_reviews'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'product review'
        verbose_name_plural = 'product reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['customer']),
        ]
    
    def __str__(self):
        return f"Review for {self.product.name} by {self.customer}"
    
    def save(self, *args, **kwargs):
        # Validate rating range
        if self.rating < 1:
            self.rating = 1
        elif self.rating > 5:
            self.rating = 5
        
        super().save(*args, **kwargs)
        
        # Update product rating
        if self.is_approved:
            self.product.update_rating()
    
    def approve(self, approved_by):
        """Approve the review."""
        from django.utils import timezone
        self.is_approved = True
        self.approved_by = approved_by
        self.approved_at = timezone.now()
        self.save(update_fields=['is_approved', 'approved_by', 'approved_at'])
        self.product.update_rating()
    
    def mark_helpful(self):
        """Mark review as helpful."""
        self.helpful_count += 1
        self.save(update_fields=['helpful_count'])

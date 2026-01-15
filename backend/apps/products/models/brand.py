"""
Brand model for product categorization.
"""
from django.db import models
from core.models import BaseModel


class Brand(BaseModel):
    """
    Brand model for products.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    banner = models.ImageField(upload_to='brands/banners/', blank=True, null=True)

    description = models.TextField(blank=True, null=True)
    short_description = models.CharField(max_length=255, blank=True, null=True)

    website = models.URLField(blank=True, null=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_verified = models.BooleanField(
        default=False,
        help_text='Brand verified by platform'
    )

    # SEO
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    meta_keywords = models.JSONField(blank=True, null=True)

    # Display
    display_order = models.PositiveIntegerField(default=0)

    # Stats
    product_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'brand'
        verbose_name_plural = 'brands'
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'is_featured']),
        ]

    def __str__(self):
        return self.name

    def update_product_count(self):
        """Update product count for this brand."""
        self.product_count = self.products.filter(is_active=True).count()
        self.save(update_fields=['product_count'])

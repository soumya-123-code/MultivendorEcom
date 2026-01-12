"""
Category model for product categorization.
"""
from django.db import models
from core.models import BaseModel


class Category(BaseModel):
    """
    Hierarchical category model for products.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    image = models.JSONField(blank=True, null=True)
    
    # Hierarchy
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )
    level = models.PositiveIntegerField(default=0)
    path = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Materialized path: 1/5/12'
    )
    
    # Display
    display_order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    meta_keywords = models.JSONField(blank=True, null=True)
    
    # Vendor-specific category (optional)
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='categories',
        help_text='NULL for global categories'
    )
    
    class Meta:
        verbose_name = 'category'
        verbose_name_plural = 'categories'
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['parent']),
            models.Index(fields=['slug']),
            models.Index(fields=['vendor']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Update level and path
        if self.parent:
            self.level = self.parent.level + 1
            parent_path = self.parent.path or str(self.parent.id)
            self.path = f"{parent_path}/{self.id}" if self.id else parent_path
        else:
            self.level = 0
            self.path = str(self.id) if self.id else ''
        
        super().save(*args, **kwargs)
        
        # Update path after save if new
        if not self.path or self.path == '':
            self.path = str(self.id)
            super().save(update_fields=['path'])
    
    def get_ancestors(self):
        """Get all ancestor categories."""
        ancestors = []
        parent = self.parent
        while parent:
            ancestors.append(parent)
            parent = parent.parent
        return list(reversed(ancestors))
    
    def get_descendants(self):
        """Get all descendant categories."""
        descendants = []
        children = self.children.filter(is_active=True)
        for child in children:
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants
    
    @property
    def full_path(self):
        """Get full category path as string."""
        ancestors = self.get_ancestors()
        path_names = [a.name for a in ancestors] + [self.name]
        return ' > '.join(path_names)

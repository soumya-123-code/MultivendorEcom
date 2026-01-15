"""
Category Attribute models for product filtering.
"""
from django.db import models
from core.models import BaseModel


class CategoryAttribute(BaseModel):
    """
    Attributes/filters for a category.
    E.g., Size, Color, Material for Clothing category.
    """
    ATTRIBUTE_TYPE_CHOICES = [
        ('text', 'Text Input'),
        ('select', 'Single Select'),
        ('multiselect', 'Multi Select'),
        ('range', 'Range (Min-Max)'),
        ('boolean', 'Yes/No'),
        ('color', 'Color Picker'),
        ('size', 'Size Selector'),
    ]

    category = models.ForeignKey(
        'products.Category',
        on_delete=models.CASCADE,
        related_name='attributes'
    )

    name = models.CharField(max_length=100, help_text='Display name e.g., "Size"')
    code = models.CharField(max_length=50, help_text='Internal code e.g., "size"')

    attribute_type = models.CharField(
        max_length=20,
        choices=ATTRIBUTE_TYPE_CHOICES,
        default='select'
    )

    # Options for select/multiselect types
    options = models.JSONField(
        blank=True,
        null=True,
        help_text='["S", "M", "L", "XL"] for select type'
    )

    # Range settings for range type
    range_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    range_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    range_step = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=1
    )
    range_unit = models.CharField(max_length=20, blank=True, null=True)

    # Behavior
    is_filterable = models.BooleanField(
        default=True,
        help_text='Show in filter sidebar'
    )
    is_searchable = models.BooleanField(
        default=True,
        help_text='Include in search'
    )
    is_required = models.BooleanField(
        default=False,
        help_text='Required when creating product'
    )
    is_variant_attribute = models.BooleanField(
        default=False,
        help_text='Use for creating variants'
    )

    # Display
    position = models.PositiveIntegerField(default=0)
    help_text = models.CharField(max_length=255, blank=True, null=True)
    placeholder = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        verbose_name = 'category attribute'
        verbose_name_plural = 'category attributes'
        ordering = ['category', 'position', 'name']
        unique_together = ['category', 'code']
        indexes = [
            models.Index(fields=['category', 'is_filterable']),
        ]

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class ProductAttributeValue(BaseModel):
    """
    Actual attribute values for a product.
    """
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='attribute_values'
    )
    attribute = models.ForeignKey(
        CategoryAttribute,
        on_delete=models.CASCADE,
        related_name='product_values'
    )

    # Value storage (flexible based on type)
    value_text = models.CharField(max_length=255, blank=True, null=True)
    value_number = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    value_boolean = models.BooleanField(null=True, blank=True)
    value_json = models.JSONField(blank=True, null=True)  # For multiselect

    class Meta:
        verbose_name = 'product attribute value'
        verbose_name_plural = 'product attribute values'
        unique_together = ['product', 'attribute']

    def __str__(self):
        return f"{self.product.name} - {self.attribute.name}: {self.get_display_value()}"

    def get_display_value(self):
        """Get human-readable value."""
        attr_type = self.attribute.attribute_type
        if attr_type == 'boolean':
            return 'Yes' if self.value_boolean else 'No'
        elif attr_type in ['select', 'text', 'color', 'size']:
            return self.value_text
        elif attr_type == 'multiselect':
            return ', '.join(self.value_json or [])
        elif attr_type == 'range':
            unit = self.attribute.range_unit or ''
            return f"{self.value_number} {unit}".strip()
        return self.value_text or ''

    @property
    def value(self):
        """Get the actual value based on type."""
        attr_type = self.attribute.attribute_type
        if attr_type == 'boolean':
            return self.value_boolean
        elif attr_type == 'multiselect':
            return self.value_json
        elif attr_type == 'range':
            return self.value_number
        return self.value_text

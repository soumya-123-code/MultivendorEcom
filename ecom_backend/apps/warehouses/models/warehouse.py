"""
Warehouse models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.choices import WarehouseTypeChoices


class Warehouse(BaseModel):
    """Warehouse model for inventory storage."""
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='warehouses'
    )
    
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    
    # Address
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=20)
    coordinates = models.JSONField(blank=True, null=True)
    
    # Contact
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_warehouses'
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    # Capacity
    SIZE_CHOICES = [
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
        ('xlarge', 'Extra Large'),
    ]
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True, null=True)
    total_capacity = models.PositiveIntegerField(null=True, blank=True)
    used_capacity = models.PositiveIntegerField(default=0)
    
    # Type
    warehouse_type = models.CharField(
        max_length=30,
        choices=WarehouseTypeChoices.CHOICES,
        default=WarehouseTypeChoices.OWNED
    )
    
    # Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    additional_details = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'warehouse'
        verbose_name_plural = 'warehouses'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class RackShelfLocation(BaseModel):
    """Storage location within warehouse."""
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='locations'
    )
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    
    floor = models.CharField(max_length=20, blank=True, null=True)
    aisle = models.CharField(max_length=20, blank=True, null=True)
    rack = models.CharField(max_length=20, blank=True, null=True)
    shelf = models.CharField(max_length=20, blank=True, null=True)
    bin = models.CharField(max_length=20, blank=True, null=True)
    
    capacity = models.PositiveIntegerField(null=True, blank=True)
    additional_details = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'rack/shelf location'
        verbose_name_plural = 'rack/shelf locations'
        unique_together = ['warehouse', 'code']
    
    def __str__(self):
        return f"{self.warehouse.code}-{self.code}"
    
    @property
    def location_code(self):
        """Generate full location code."""
        parts = [self.floor, self.aisle, self.rack, self.shelf, self.bin]
        return '-'.join(filter(None, parts))

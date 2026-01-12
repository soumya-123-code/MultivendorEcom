"""
Supplier model for purchase order management.
"""
from django.db import models
from core.models import BaseModel


class Supplier(BaseModel):
    """
    Supplier model for vendors to manage their suppliers.
    """
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='suppliers'
    )
    
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    
    # Contact
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Address
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=20, blank=True, null=True)
    
    # Business
    tax_id = models.CharField(max_length=100, blank=True, null=True)
    
    PAYMENT_TERMS_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('net_15', 'Net 15'),
        ('net_30', 'Net 30'),
        ('net_60', 'Net 60'),
        ('advance', 'Advance Payment'),
    ]
    payment_terms = models.CharField(
        max_length=50,
        choices=PAYMENT_TERMS_CHOICES,
        default='net_30'
    )
    
    # Bank Details
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc = models.CharField(max_length=20, blank=True, null=True)
    
    # Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    
    # Metadata
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'supplier'
        verbose_name_plural = 'suppliers'
        unique_together = ['vendor', 'code']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.vendor.store_name})"

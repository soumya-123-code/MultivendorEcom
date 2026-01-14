"""
Vendor model for store/seller management.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.constants import VendorStatus
from core.utils.choices import BusinessTypeChoices


class Vendor(BaseModel):
    """
    Vendor/Store model for multi-vendor marketplace.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor'
    )
    
    # Store Information
    store_name = models.CharField(max_length=255)
    store_slug = models.SlugField(max_length=255, unique=True)
    store_logo = models.JSONField(blank=True, null=True)
    store_banner = models.JSONField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # Contact
    business_email = models.EmailField(blank=True, null=True)
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Business Details
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_type = models.CharField(
        max_length=50,
        choices=BusinessTypeChoices.CHOICES,
        blank=True,
        null=True
    )
    tax_id = models.CharField(max_length=100, blank=True, null=True)
    registration_number = models.CharField(max_length=100, blank=True, null=True)
    
    # Address
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=20, blank=True, null=True)
    
    # Bank Details
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc = models.CharField(max_length=20, blank=True, null=True)
    bank_account_holder = models.CharField(max_length=255, blank=True, null=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=VendorStatus.CHOICES,
        default=VendorStatus.PENDING,
        db_index=True
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_vendors'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Settings
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.00,
        help_text='Commission percentage'
    )
    min_order_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    max_order_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Metadata
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_products = models.PositiveIntegerField(default=0)
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    class Meta:
        verbose_name = 'vendor'
        verbose_name_plural = 'vendors'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['store_slug']),
        ]
    
    def __str__(self):
        return self.store_name
    
    @property
    def is_approved(self):
        return self.status == VendorStatus.APPROVED
    
    def approve(self, approved_by):
        """Approve the vendor."""
        from django.utils import timezone
        self.status = VendorStatus.APPROVED
        self.approved_by = approved_by
        self.approved_at = timezone.now()
        self.save(update_fields=['status', 'approved_by', 'approved_at'])
    
    def reject(self, reason):
        """Reject the vendor."""
        self.status = VendorStatus.REJECTED
        self.rejection_reason = reason
        self.save(update_fields=['status', 'rejection_reason'])
    
    def suspend(self):
        """Suspend the vendor."""
        self.status = VendorStatus.SUSPENDED
        self.save(update_fields=['status'])


class VendorStaff(BaseModel):
    """
    Staff members associated with a vendor.
    """
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='staff_members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_staff'
    )
    
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    ]
    
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='staff')
    permissions = models.JSONField(
        blank=True,
        null=True,
        help_text='Specific permissions override'
    )
    
    class Meta:
        verbose_name = 'vendor staff'
        verbose_name_plural = 'vendor staff'
        unique_together = ['vendor', 'user']
    
    def __str__(self):
        return f"{self.user.email} - {self.vendor.store_name}"

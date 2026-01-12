"""
Delivery Agent models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.choices import VehicleTypeChoices, IDTypeChoices
from core.utils.constants import DeliveryStatus


class DeliveryAgent(BaseModel):
    """Delivery agent profile."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='delivery_agent'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delivery_agents',
        help_text='Vendor-specific delivery agent'
    )
    
    # Personal Details
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    
    # Identity
    id_type = models.CharField(
        max_length=50,
        choices=IDTypeChoices.CHOICES,
        blank=True,
        null=True
    )
    id_number = models.CharField(max_length=100, blank=True, null=True)
    id_document = models.JSONField(blank=True, null=True)
    
    # Vehicle Details
    vehicle_type = models.CharField(
        max_length=50,
        choices=VehicleTypeChoices.CHOICES,
        blank=True,
        null=True
    )
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    vehicle_document = models.JSONField(blank=True, null=True)
    
    # Address
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    
    # Bank Details
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc = models.CharField(max_length=20, blank=True, null=True)
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_delivery_agents'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Availability
    is_available = models.BooleanField(default=False)
    current_location = models.JSONField(blank=True, null=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    
    # Stats
    total_deliveries = models.PositiveIntegerField(default=0)
    successful_deliveries = models.PositiveIntegerField(default=0)
    failed_deliveries = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    
    class Meta:
        verbose_name = 'delivery agent'
        verbose_name_plural = 'delivery agents'
    
    def __str__(self):
        return self.user.email


class DeliveryAssignment(BaseModel):
    """Delivery assignment linking order to agent."""
    sales_order = models.ForeignKey(
        'sales_orders.SalesOrder',
        on_delete=models.CASCADE,
        related_name='delivery_assignments'
    )
    delivery_agent = models.ForeignKey(
        DeliveryAgent,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assignments'
    )
    
    # Pickup Details
    pickup_address = models.JSONField()
    pickup_contact_name = models.CharField(max_length=255, blank=True, null=True)
    pickup_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Delivery Details
    delivery_address = models.JSONField()
    delivery_contact_name = models.CharField(max_length=255)
    delivery_contact_phone = models.CharField(max_length=20)
    delivery_instructions = models.TextField(blank=True, null=True)
    
    # Schedule
    estimated_pickup_time = models.DateTimeField(null=True, blank=True)
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=30,
        choices=DeliveryStatus.CHOICES,
        default=DeliveryStatus.ASSIGNED
    )
    
    # Attempts
    delivery_attempts = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=3)
    
    # Financial
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cod_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cod_collected = models.BooleanField(default=False)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    failure_reason = models.CharField(max_length=255, blank=True, null=True)
    
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='delivery_assignments'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'delivery assignment'
        verbose_name_plural = 'delivery assignments'
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"Delivery for {self.sales_order.order_number}"


class DeliveryStatusLog(BaseModel):
    """Delivery status change log."""
    assignment = models.ForeignKey(
        DeliveryAssignment,
        on_delete=models.CASCADE,
        related_name='status_logs'
    )
    
    old_status = models.CharField(max_length=30, blank=True, null=True)
    new_status = models.CharField(max_length=30)
    notes = models.TextField(blank=True, null=True)
    location = models.JSONField(blank=True, null=True)
    
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    class Meta:
        verbose_name = 'delivery status log'
        verbose_name_plural = 'delivery status logs'
        ordering = ['-created_at']


class DeliveryProof(BaseModel):
    """Proof of delivery."""
    assignment = models.ForeignKey(
        DeliveryAssignment,
        on_delete=models.CASCADE,
        related_name='proofs'
    )
    
    PROOF_TYPE_CHOICES = [
        ('photo', 'Photo'),
        ('signature', 'Signature'),
        ('otp', 'OTP'),
        ('document', 'Document'),
    ]
    proof_type = models.CharField(max_length=30, choices=PROOF_TYPE_CHOICES)
    proof_data = models.JSONField()
    
    captured_at = models.DateTimeField()
    location = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'delivery proof'
        verbose_name_plural = 'delivery proofs'

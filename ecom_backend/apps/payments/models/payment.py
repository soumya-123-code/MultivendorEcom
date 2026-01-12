"""
Payment models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.constants import PaymentStatus


class Payment(BaseModel):
    """Payment transaction model."""
    sales_order = models.ForeignKey(
        'sales_orders.SalesOrder',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    payment_number = models.CharField(max_length=50, unique=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    
    # Payment Method
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
        ('cod', 'Cash on Delivery'),
        ('wallet', 'Wallet'),
    ]
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    
    # Gateway
    payment_gateway = models.CharField(max_length=50, blank=True, null=True)
    gateway_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_response = models.JSONField(blank=True, null=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.CHOICES,
        default=PaymentStatus.PENDING
    )
    
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'payment'
        verbose_name_plural = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payment_number} - {self.amount}"


class Refund(BaseModel):
    """Refund transaction model."""
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds'
    )
    sales_order = models.ForeignKey(
        'sales_orders.SalesOrder',
        on_delete=models.CASCADE,
        related_name='refunds'
    )
    
    refund_number = models.CharField(max_length=50, unique=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(blank=True, null=True)
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Gateway
    gateway_refund_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_response = models.JSONField(blank=True, null=True)
    
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refunds'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'refund'
        verbose_name_plural = 'refunds'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.refund_number} - {self.amount}"

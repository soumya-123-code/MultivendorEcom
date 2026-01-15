"""
Return Request and RMA models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel


class ReturnRequest(BaseModel):
    """
    Return/RMA request from customer.
    """
    RETURN_STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('pickup_scheduled', 'Pickup Scheduled'),
        ('pickup_completed', 'Pickup Completed'),
        ('in_transit', 'In Transit'),
        ('received', 'Received at Warehouse'),
        ('inspecting', 'Under Inspection'),
        ('inspection_passed', 'Inspection Passed'),
        ('inspection_failed', 'Inspection Failed'),
        ('refund_initiated', 'Refund Initiated'),
        ('refund_completed', 'Refund Completed'),
        ('replacement_shipped', 'Replacement Shipped'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    RETURN_TYPE_CHOICES = [
        ('refund', 'Refund'),
        ('replacement', 'Replacement'),
        ('exchange', 'Exchange'),
    ]

    RETURN_REASON_CHOICES = [
        ('defective', 'Defective/Damaged Product'),
        ('wrong_item', 'Wrong Item Delivered'),
        ('not_as_described', 'Not as Described'),
        ('size_fit', 'Size/Fit Issue'),
        ('quality', 'Quality Issue'),
        ('changed_mind', 'Changed Mind'),
        ('better_price', 'Found Better Price'),
        ('late_delivery', 'Late Delivery'),
        ('missing_parts', 'Missing Parts/Accessories'),
        ('other', 'Other'),
    ]

    # Link to vendor order (not master order)
    vendor_order = models.ForeignKey(
        'sales_orders.VendorOrder',
        on_delete=models.CASCADE,
        related_name='return_requests'
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='return_requests'
    )

    return_number = models.CharField(max_length=50, unique=True)

    return_type = models.CharField(
        max_length=20,
        choices=RETURN_TYPE_CHOICES,
        default='refund'
    )
    reason = models.CharField(
        max_length=30,
        choices=RETURN_REASON_CHOICES
    )
    reason_detail = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=30,
        choices=RETURN_STATUS_CHOICES,
        default='requested',
        db_index=True
    )

    # Images/proof
    images = models.JSONField(
        blank=True,
        null=True,
        help_text='Customer uploaded images of issue'
    )

    # Pickup details
    pickup_address = models.ForeignKey(
        'customers.CustomerAddress',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    pickup_address_snapshot = models.JSONField(blank=True, null=True)
    pickup_scheduled_date = models.DateField(null=True, blank=True)
    pickup_completed_date = models.DateField(null=True, blank=True)
    pickup_agent = models.ForeignKey(
        'delivery_agents.DeliveryAgent',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='return_pickups'
    )

    # Inspection
    inspection_notes = models.TextField(blank=True, null=True)
    inspection_result = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        choices=[
            ('passed', 'Passed'),
            ('failed', 'Failed'),
            ('partial', 'Partial Accept'),
        ]
    )
    inspected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inspected_returns'
    )
    inspected_at = models.DateTimeField(null=True, blank=True)

    # Refund details
    refund_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    refund_method = models.CharField(max_length=30, blank=True, null=True)
    refund = models.ForeignKey(
        'payments.Refund',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='return_requests'
    )

    # Replacement details
    replacement_order = models.ForeignKey(
        'sales_orders.VendorOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replacement_for'
    )

    # Workflow
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_returns'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rejected_returns'
    )
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Notes
    customer_notes = models.TextField(blank=True, null=True)
    vendor_notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'return request'
        verbose_name_plural = 'return requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor_order']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.return_number} - {self.vendor_order.order_number}"

    def generate_return_number(self):
        """Generate unique return number."""
        import uuid
        return f"RET-{uuid.uuid4().hex[:8].upper()}"


class ReturnItem(BaseModel):
    """
    Individual item in a return request.
    """
    return_request = models.ForeignKey(
        ReturnRequest,
        on_delete=models.CASCADE,
        related_name='items'
    )
    vendor_order_item = models.ForeignKey(
        'sales_orders.VendorOrderItem',
        on_delete=models.CASCADE,
        related_name='return_items'
    )

    # Quantity
    quantity_requested = models.PositiveIntegerField()
    quantity_approved = models.PositiveIntegerField(default=0)
    quantity_received = models.PositiveIntegerField(default=0)
    quantity_refunded = models.PositiveIntegerField(default=0)

    # Snapshot
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100)
    variant_name = models.CharField(max_length=255, blank=True, null=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Amounts
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Item-level inspection
    inspection_result = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        choices=[
            ('passed', 'Passed'),
            ('failed', 'Failed'),
            ('partial', 'Partial'),
        ]
    )
    inspection_notes = models.TextField(blank=True, null=True)

    reason = models.CharField(max_length=30, blank=True, null=True)
    reason_detail = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'return item'
        verbose_name_plural = 'return items'

    def __str__(self):
        return f"{self.product_name} x {self.quantity_requested}"

    def save(self, *args, **kwargs):
        # Snapshot from order item
        if not self.product_name:
            self.product_name = self.vendor_order_item.product_name
        if not self.product_sku:
            self.product_sku = self.vendor_order_item.product_sku
        if not self.variant_name:
            self.variant_name = self.vendor_order_item.variant_name
        if not self.unit_price:
            self.unit_price = self.vendor_order_item.unit_price

        super().save(*args, **kwargs)


class ReturnStatusLog(BaseModel):
    """
    Status change log for returns.
    """
    return_request = models.ForeignKey(
        ReturnRequest,
        on_delete=models.CASCADE,
        related_name='status_logs'
    )

    old_status = models.CharField(max_length=30, blank=True, null=True)
    new_status = models.CharField(max_length=30)
    notes = models.TextField(blank=True, null=True)

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        verbose_name = 'return status log'
        verbose_name_plural = 'return status logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.return_request.return_number}: {self.old_status} -> {self.new_status}"

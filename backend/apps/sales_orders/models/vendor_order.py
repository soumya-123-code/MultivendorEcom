"""
Vendor Order models for multi-vendor order splits.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.constants import SOStatus, PaymentStatus


class VendorOrder(BaseModel):
    """
    Vendor-specific order split from a master SalesOrder.
    Each vendor in a multi-vendor cart gets their own VendorOrder.
    """
    sales_order = models.ForeignKey(
        'sales_orders.SalesOrder',
        on_delete=models.CASCADE,
        related_name='vendor_orders'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='vendor_orders'
    )

    # Unique order number for vendor
    order_number = models.CharField(max_length=50, unique=True)

    # Independent status per vendor
    status = models.CharField(
        max_length=30,
        choices=SOStatus.CHOICES,
        default=SOStatus.PENDING,
        db_index=True
    )

    # Amounts for this vendor's portion
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Commission
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text='Commission percentage for this order'
    )
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vendor_earning = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Amount vendor will receive after commission'
    )

    # Payment status for this vendor portion
    payment_status = models.CharField(
        max_length=30,
        choices=PaymentStatus.CHOICES,
        default=PaymentStatus.PENDING
    )

    # Settlement tracking
    is_settled = models.BooleanField(default=False)
    settlement = models.ForeignKey(
        'vendors.VendorSettlement',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendor_orders'
    )

    # Delivery
    delivery_assignment = models.ForeignKey(
        'delivery_agents.DeliveryAssignment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendor_orders'
    )

    # Fulfillment
    packed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Notes
    vendor_notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'vendor order'
        verbose_name_plural = 'vendor orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['sales_order']),
            models.Index(fields=['vendor', 'created_at']),
            models.Index(fields=['is_settled']),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.vendor.store_name}"

    def calculate_totals(self):
        """Calculate totals from items."""
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)
        self.tax_amount = sum(item.tax_amount for item in items)
        self.total_amount = self.subtotal - self.discount_amount + self.tax_amount + self.shipping_amount

        # Calculate commission
        self.commission_rate = self.vendor.commission_rate or 0
        self.commission_amount = self.total_amount * (self.commission_rate / 100)
        self.vendor_earning = self.total_amount - self.commission_amount

        self.save(update_fields=[
            'subtotal', 'tax_amount', 'total_amount',
            'commission_rate', 'commission_amount', 'vendor_earning'
        ])

    def generate_order_number(self):
        """Generate unique vendor order number."""
        import uuid
        prefix = self.vendor.store_slug[:3].upper() if self.vendor.store_slug else 'VO'
        return f"{prefix}-{self.sales_order.order_number}-{uuid.uuid4().hex[:6].upper()}"


class VendorOrderItem(BaseModel):
    """
    Line item for a vendor order.
    """
    vendor_order = models.ForeignKey(
        VendorOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    inventory = models.ForeignKey(
        'inventory.Inventory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # Product Snapshot (preserved at time of order)
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100)
    product_image = models.JSONField(blank=True, null=True)
    variant_name = models.CharField(max_length=255, blank=True, null=True)
    variant_attributes = models.JSONField(blank=True, null=True)

    # Quantities
    quantity_ordered = models.PositiveIntegerField()
    quantity_packed = models.PositiveIntegerField(default=0)
    quantity_shipped = models.PositiveIntegerField(default=0)
    quantity_delivered = models.PositiveIntegerField(default=0)
    quantity_cancelled = models.PositiveIntegerField(default=0)
    quantity_returned = models.PositiveIntegerField(default=0)

    # Pricing
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Discount
    discount_type = models.CharField(max_length=20, blank=True, null=True)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Tax
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Totals
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Commission at item level
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'vendor order item'
        verbose_name_plural = 'vendor order items'

    def __str__(self):
        return f"{self.product_name} x {self.quantity_ordered}"

    def save(self, *args, **kwargs):
        # Store product snapshot
        if not self.product_name:
            self.product_name = self.product.name
        if not self.product_sku:
            self.product_sku = self.product.sku
        if not self.product_image:
            self.product_image = self.product.primary_image
        if self.variant:
            if not self.variant_name:
                self.variant_name = self.variant.name
            if not self.variant_attributes:
                self.variant_attributes = self.variant.attributes

        # Calculate amounts
        self.subtotal = self.unit_price * self.quantity_ordered

        if self.discount_type == 'percentage':
            self.discount_amount = self.subtotal * (self.discount_value / 100)
        elif self.discount_type == 'amount':
            self.discount_amount = self.discount_value

        self.tax_amount = (self.subtotal - self.discount_amount) * (self.tax_percentage / 100)
        self.total = self.subtotal - self.discount_amount + self.tax_amount

        # Calculate commission
        self.commission_amount = self.total * (self.commission_rate / 100)

        super().save(*args, **kwargs)


class VendorOrderStatusLog(BaseModel):
    """
    Status change log for vendor orders.
    """
    vendor_order = models.ForeignKey(
        VendorOrder,
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
        verbose_name = 'vendor order status log'
        verbose_name_plural = 'vendor order status logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.vendor_order.order_number}: {self.old_status} -> {self.new_status}"

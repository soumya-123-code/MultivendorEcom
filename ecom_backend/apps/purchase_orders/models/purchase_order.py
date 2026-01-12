"""
Purchase Order models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.constants import POStatus, PaymentStatus
from decimal import Decimal


class PurchaseOrder(BaseModel):
    """Purchase Order model."""
    
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='purchase_orders'
    )
    supplier = models.ForeignKey(
        'vendors.Supplier',
        on_delete=models.CASCADE,
        related_name='purchase_orders'
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        related_name='purchase_orders'
    )
    
    po_number = models.CharField(max_length=50, unique=True)
    po_date = models.DateField()
    expected_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=30,
        choices=POStatus.CHOICES,
        default=POStatus.DRAFT,
        db_index=True
    )
    
    # Payment
    payment_terms = models.CharField(max_length=50, blank=True, null=True)
    payment_status = models.CharField(
        max_length=30,
        choices=PaymentStatus.CHOICES,
        default=PaymentStatus.PENDING
    )
    
    # Discount
    DISCOUNT_TYPE_CHOICES = [
        ('none', 'None'),
        ('percentage', 'Percentage'),
        ('amount', 'Fixed Amount'),
        ('item_level', 'Item Level'),
    ]
    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default='none'
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)
    
    # Approval
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_purchase_orders'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Cancellation
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_purchase_orders'
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'purchase order'
        verbose_name_plural = 'purchase orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.po_number} - {self.vendor.store_name}"
    
    def calculate_totals(self):
        """Calculate order totals from items."""
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)
        
        if self.discount_type == 'percentage':
            self.discount_amount = self.subtotal * (self.discount_value / 100)
        elif self.discount_type == 'amount':
            self.discount_amount = self.discount_value
        else:
            self.discount_amount = sum(item.discount_amount for item in items)
        
        self.tax_amount = sum(item.tax_amount for item in items)
        self.total_amount = self.subtotal - self.discount_amount + self.tax_amount + self.shipping_amount
        self.save(update_fields=['subtotal', 'discount_amount', 'tax_amount', 'total_amount'])


class PurchaseOrderItem(BaseModel):
    """Purchase Order line item."""
    purchase_order = models.ForeignKey(
        PurchaseOrder,
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
    
    # Quantities
    quantity_ordered = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    quantity_cancelled = models.PositiveIntegerField(default=0)
    quantity_returned = models.PositiveIntegerField(default=0)
    
    # Pricing
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Discount
    discount_type = models.CharField(max_length=20, blank=True, null=True)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Tax
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Totals
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    
    notes = models.TextField(blank=True, null=True)
    additional_details = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'purchase order item'
        verbose_name_plural = 'purchase order items'
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity_ordered}"
    
    def save(self, *args, **kwargs):
        qty = self.quantity_ordered or 0
        unit_price = self.unit_price or Decimal("0")
        discount_value = self.discount_value or Decimal("0")
        tax_percent = self.tax_percentage or Decimal("0")

        # Subtotal
        self.subtotal = (unit_price * qty).quantize(Decimal("0.01"))

        # Discount
        if self.discount_type == "percentage":
            self.discount_amount = (self.subtotal * discount_value / Decimal("100")).quantize(Decimal("0.01"))
        elif self.discount_type == "amount":
            self.discount_amount = discount_value
        else:
            self.discount_amount = Decimal("0.00")

        # Tax
        taxable_amount = self.subtotal - self.discount_amount
        self.tax_amount = (taxable_amount * tax_percent / Decimal("100")).quantize(Decimal("0.01"))

        # Final Total
        self.total = (taxable_amount + self.tax_amount).quantize(Decimal("0.01"))

        super().save(*args, **kwargs)
    
    @property
    def quantity_pending(self):
        """Quantity pending to receive."""
        return self.quantity_ordered - self.quantity_received - self.quantity_cancelled


class POStatusLog(BaseModel):
    """Purchase Order status change log."""
    purchase_order = models.ForeignKey(
        PurchaseOrder,
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
        verbose_name = 'PO status log'
        verbose_name_plural = 'PO status logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.purchase_order.po_number}: {self.old_status} -> {self.new_status}"

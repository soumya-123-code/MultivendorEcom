"""
Sales Order models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.constants import SOStatus, PaymentStatus
from core.utils.choices import OrderSourceChoices, PaymentMethodChoices


class SalesOrder(BaseModel):
    """Sales Order model."""
    
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='sales_orders'
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='orders'
    )
    
    order_number = models.CharField(max_length=50, unique=True)
    order_date = models.DateTimeField(auto_now_add=True)
    
    # Source
    order_source = models.CharField(
        max_length=30,
        choices=OrderSourceChoices.CHOICES,
        default=OrderSourceChoices.WEB
    )
    
    # Status
    status = models.CharField(
        max_length=30,
        choices=SOStatus.CHOICES,
        default=SOStatus.PENDING,
        db_index=True
    )
    
    # Addresses
    shipping_address = models.ForeignKey(
        'customers.CustomerAddress',
        on_delete=models.SET_NULL,
        null=True,
        related_name='shipping_orders'
    )
    billing_address = models.ForeignKey(
        'customers.CustomerAddress',
        on_delete=models.SET_NULL,
        null=True,
        related_name='billing_orders'
    )
    shipping_address_snapshot = models.JSONField(blank=True, null=True)
    billing_address_snapshot = models.JSONField(blank=True, null=True)
    
    # Discount
    discount_type = models.CharField(max_length=20, blank=True, null=True)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    
    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Payment
    payment_status = models.CharField(
        max_length=30,
        choices=PaymentStatus.CHOICES,
        default=PaymentStatus.PENDING
    )
    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethodChoices.CHOICES,
        blank=True,
        null=True
    )
    
    # Shipping
    shipping_method = models.CharField(max_length=50, blank=True, null=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    # Notes
    customer_notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    
    # Approval
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_sales_orders'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Cancellation
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_sales_orders'
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'sales order'
        verbose_name_plural = 'sales orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order_number} - {self.customer.user.email}"
    
    def calculate_totals(self):
        """Calculate order totals from items."""
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)
        
        if self.discount_type == 'percentage':
            self.discount_amount = self.subtotal * (self.discount_value / 100)
        elif self.discount_type == 'amount':
            self.discount_amount = self.discount_value
        
        self.tax_amount = sum(item.tax_amount for item in items)
        self.total_amount = self.subtotal - self.discount_amount + self.tax_amount + self.shipping_amount
        self.save(update_fields=['subtotal', 'discount_amount', 'tax_amount', 'total_amount'])


class SalesOrderItem(BaseModel):
    """Sales Order line item."""
    sales_order = models.ForeignKey(
        SalesOrder,
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
    
    # Product Snapshot
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100)
    product_image = models.JSONField(blank=True, null=True)
    
    # Quantities
    quantity_ordered = models.PositiveIntegerField()
    quantity_shipped = models.PositiveIntegerField(default=0)
    quantity_delivered = models.PositiveIntegerField(default=0)
    quantity_cancelled = models.PositiveIntegerField(default=0)
    quantity_returned = models.PositiveIntegerField(default=0)
    
    # Pricing
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
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
    
    class Meta:
        verbose_name = 'sales order item'
        verbose_name_plural = 'sales order items'
    
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
        
        # Calculate amounts
        self.subtotal = self.unit_price * self.quantity_ordered
        
        if self.discount_type == 'percentage':
            self.discount_amount = self.subtotal * (self.discount_value / 100)
        elif self.discount_type == 'amount':
            self.discount_amount = self.discount_value
        
        self.tax_amount = (self.subtotal - self.discount_amount) * (self.tax_percentage / 100)
        self.total = self.subtotal - self.discount_amount + self.tax_amount
        
        super().save(*args, **kwargs)


class SOStatusLog(BaseModel):
    """Sales Order status change log."""
    sales_order = models.ForeignKey(
        SalesOrder,
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
        verbose_name = 'SO status log'
        verbose_name_plural = 'SO status logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.sales_order.order_number}: {self.old_status} -> {self.new_status}"

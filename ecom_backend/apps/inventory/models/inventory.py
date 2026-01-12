"""
Inventory models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.utils.constants import StockStatus, MovementType


class Inventory(BaseModel):
    """Inventory model for stock tracking."""
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='inventory_items'
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='inventory_items'
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        related_name='inventory_items'
    )
    location = models.ForeignKey(
        'warehouses.RackShelfLocation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_items'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='inventory_items'
    )
    
    # Quantities
    quantity = models.IntegerField(default=0)
    reserved_quantity = models.IntegerField(default=0)
    
    # Batch Info
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Pricing
    buy_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sell_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status
    stock_status = models.CharField(
        max_length=20,
        choices=StockStatus.CHOICES,
        default=StockStatus.IN_STOCK
    )
    
    # Source
    INWARD_TYPE_CHOICES = [
        ('purchase', 'Purchase'),
        ('return', 'Return'),
        ('transfer', 'Transfer'),
        ('adjustment', 'Adjustment'),
        ('initial', 'Initial Stock'),
    ]
    inward_type = models.CharField(
        max_length=30,
        choices=INWARD_TYPE_CHOICES,
        default='purchase'
    )
    
    # Links to source
    purchase_order = models.ForeignKey(
        'purchase_orders.PurchaseOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_items'
    )
    purchase_order_item = models.ForeignKey(
        'purchase_orders.PurchaseOrderItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_items'
    )
    
    additional_details = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'inventory'
        verbose_name_plural = 'inventory items'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product.name} - {self.warehouse.code} ({self.quantity})"
    
    @property
    def available_quantity(self):
        """Calculate available quantity."""
        return max(0, self.quantity - self.reserved_quantity)
    
    def reserve(self, qty: int):
        """Reserve quantity for an order."""
        if qty > self.available_quantity:
            raise ValueError("Insufficient available quantity.")
        self.reserved_quantity += qty
        self.save(update_fields=['reserved_quantity'])
    
    def unreserve(self, qty: int):
        """Release reserved quantity."""
        self.reserved_quantity = max(0, self.reserved_quantity - qty)
        self.save(update_fields=['reserved_quantity'])
    
    def update_stock_status(self):
        """Update stock status based on quantity."""
        product = self.product
        if self.quantity <= 0:
            self.stock_status = StockStatus.OUT_OF_STOCK
        elif self.quantity <= product.low_stock_threshold:
            self.stock_status = StockStatus.LOW_STOCK
        else:
            self.stock_status = StockStatus.IN_STOCK
        self.save(update_fields=['stock_status'])


class InventoryLog(BaseModel):
    """Inventory movement log for audit trail."""
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='inventory_logs'
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        related_name='inventory_logs'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='inventory_logs'
    )
    
    movement_type = models.CharField(
        max_length=30,
        choices=MovementType.CHOICES
    )
    
    quantity = models.IntegerField()
    quantity_before = models.IntegerField(null=True, blank=True)
    quantity_after = models.IntegerField(null=True, blank=True)
    
    # Reference to source transaction
    reference_type = models.CharField(max_length=50, blank=True, null=True)
    reference_id = models.PositiveIntegerField(blank=True, null=True)
    
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'inventory log'
        verbose_name_plural = 'inventory logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.movement_type} - {self.product.name} ({self.quantity})"

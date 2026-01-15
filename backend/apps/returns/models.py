"""
Returns management models.
"""
from django.db import models
from core.models import BaseModel
from apps.sales_orders.models import SalesOrder, SalesOrderItem
from django.conf import settings

class ReturnRequest(BaseModel):
    """Return request for an order."""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('received', 'Received'),
        ('refunded', 'Refunded'),
    )
    
    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='returns')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    reason = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    admin_notes = models.TextField(blank=True, null=True)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Return Request'
        verbose_name_plural = 'Return Requests'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Return #{self.id} - {self.order.order_number}"

class ReturnItem(BaseModel):
    """Items included in the return request."""
    return_request = models.ForeignKey(ReturnRequest, on_delete=models.CASCADE, related_name='items')
    order_item = models.ForeignKey(SalesOrderItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    condition = models.CharField(max_length=50, blank=True, null=True)  # Opened, Damaged, Unopened
    
    class Meta:
        unique_together = ('return_request', 'order_item')

    def __str__(self):
        return f"{self.quantity} x {self.order_item.product_name}"

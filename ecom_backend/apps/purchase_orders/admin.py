from django.contrib import admin
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, POStatusLog


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'vendor', 'supplier', 'status', 'total_amount', 'po_date']
    list_filter = ['status', 'payment_status', 'vendor']
    search_fields = ['po_number', 'supplier__name']
    raw_id_fields = ['vendor', 'supplier', 'warehouse', 'approved_by', 'cancelled_by']


@admin.register(PurchaseOrderItem)
class PurchaseOrderItemAdmin(admin.ModelAdmin):
    list_display = ['purchase_order', 'product', 'quantity_ordered', 'quantity_received', 'total']
    search_fields = ['purchase_order__po_number', 'product__name']
    raw_id_fields = ['purchase_order', 'product', 'variant']


@admin.register(POStatusLog)
class POStatusLogAdmin(admin.ModelAdmin):
    list_display = ['purchase_order', 'old_status', 'new_status', 'changed_by', 'created_at']
    raw_id_fields = ['purchase_order', 'changed_by']

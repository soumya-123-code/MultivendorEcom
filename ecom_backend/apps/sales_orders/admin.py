from django.contrib import admin
from apps.sales_orders.models import SalesOrder, SalesOrderItem, SOStatusLog


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'vendor', 'status', 'total_amount', 'order_date']
    list_filter = ['status', 'payment_status', 'vendor']
    search_fields = ['order_number', 'customer__user__email']
    raw_id_fields = ['vendor', 'customer', 'shipping_address', 'billing_address', 'approved_by', 'cancelled_by']


@admin.register(SalesOrderItem)
class SalesOrderItemAdmin(admin.ModelAdmin):
    list_display = ['sales_order', 'product_name', 'quantity_ordered', 'quantity_shipped', 'total']
    search_fields = ['sales_order__order_number', 'product_name']
    raw_id_fields = ['sales_order', 'product', 'variant', 'inventory']


@admin.register(SOStatusLog)
class SOStatusLogAdmin(admin.ModelAdmin):
    list_display = ['sales_order', 'old_status', 'new_status', 'changed_by', 'created_at']
    raw_id_fields = ['sales_order', 'changed_by']

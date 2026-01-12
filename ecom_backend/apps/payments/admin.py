from django.contrib import admin
from apps.payments.models import Payment, Refund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_number', 'sales_order', 'amount', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'payment_gateway']
    search_fields = ['payment_number', 'sales_order__order_number']
    raw_id_fields = ['sales_order', 'vendor', 'customer']


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ['refund_number', 'payment', 'amount', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['refund_number']
    raw_id_fields = ['payment', 'sales_order', 'processed_by']

"""
Payment serializers.
"""
from rest_framework import serializers
from apps.payments.models import Payment, Refund


class PaymentListSerializer(serializers.ModelSerializer):
    """Serializer for payment list view."""
    order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'sales_order', 'order_number',
            'customer', 'customer_email', 'vendor', 'vendor_name',
            'amount', 'currency', 'payment_method', 'status',
            'paid_at', 'created_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Detailed payment serializer."""
    order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    customer_name = serializers.SerializerMethodField()
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    refunds = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'sales_order', 'order_number',
            'customer', 'customer_email', 'customer_name',
            'vendor', 'vendor_name',
            'amount', 'currency', 'payment_method',
            'payment_gateway', 'gateway_transaction_id', 'gateway_response',
            'status', 'paid_at', 'notes', 'refunds',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        user = obj.customer.user
        return f"{user.first_name} {user.last_name}".strip() or user.email
    
    def get_refunds(self, obj):
        refunds = obj.refunds.all()
        return RefundListSerializer(refunds, many=True).data


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for initiating payment."""
    sales_order = serializers.IntegerField(required=True)
    payment_method = serializers.ChoiceField(
        choices=['card', 'upi', 'netbanking', 'cod', 'wallet'],
        required=True
    )
    payment_gateway = serializers.CharField(required=False, allow_blank=True)


class PaymentConfirmSerializer(serializers.Serializer):
    """Serializer for confirming payment."""
    gateway_transaction_id = serializers.CharField(required=True)
    gateway_response = serializers.JSONField(required=False)


class RefundListSerializer(serializers.ModelSerializer):
    """Serializer for refund list view."""
    payment_number = serializers.CharField(source='payment.payment_number', read_only=True)
    order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'refund_number', 'payment', 'payment_number',
            'sales_order', 'order_number', 'amount', 'reason',
            'status', 'processed_at', 'created_at'
        ]


class RefundSerializer(serializers.ModelSerializer):
    """Detailed refund serializer."""
    payment_number = serializers.CharField(source='payment.payment_number', read_only=True)
    order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    processed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Refund
        fields = [
            'id', 'refund_number', 'payment', 'payment_number',
            'sales_order', 'order_number', 'amount', 'reason',
            'status', 'gateway_refund_id', 'gateway_response',
            'processed_by', 'processed_by_name', 'processed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'refund_number', 'created_at', 'updated_at']
    
    def get_processed_by_name(self, obj):
        if obj.processed_by:
            return f"{obj.processed_by.first_name} {obj.processed_by.last_name}".strip() or obj.processed_by.email
        return None


class RefundCreateSerializer(serializers.Serializer):
    """Serializer for creating refund."""
    payment_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    reason = serializers.CharField(required=True, max_length=500)


class RefundProcessSerializer(serializers.Serializer):
    """Serializer for processing refund."""
    action = serializers.ChoiceField(choices=['approve', 'reject'], required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    gateway_refund_id = serializers.CharField(required=False, allow_blank=True)

"""
Sales Order serializers.
"""
from rest_framework import serializers
from apps.sales_orders.models import SalesOrder, SalesOrderItem, SOStatusLog


class SalesOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for sales order items."""
    class Meta:
        model = SalesOrderItem
        fields = [
            'id', 'product', 'variant', 'inventory',
            'product_name', 'product_sku', 'product_image',
            'quantity_ordered', 'quantity_shipped', 'quantity_delivered',
            'quantity_cancelled', 'quantity_returned',
            'unit_price', 'discount_type', 'discount_value', 'discount_amount',
            'tax_percentage', 'tax_amount', 'subtotal', 'total', 'notes'
        ]
        read_only_fields = ['id', 'product_name', 'product_sku', 'product_image']


class SalesOrderItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sales order items."""
    class Meta:
        model = SalesOrderItem
        fields = [
            'product', 'variant', 'quantity_ordered', 'unit_price',
            'discount_type', 'discount_value', 'tax_percentage', 'notes'
        ]


class SOStatusLogSerializer(serializers.ModelSerializer):
    """Serializer for status logs."""
    changed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SOStatusLog
        fields = ['id', 'old_status', 'new_status', 'notes', 'changed_by', 'changed_by_name', 'created_at']
    
    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip() or obj.changed_by.email
        return None


class SalesOrderListSerializer(serializers.ModelSerializer):
    """Serializer for sales order list view."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SalesOrder
        fields = [
            'id', 'order_number', 'order_date', 'order_source',
            'vendor', 'vendor_name', 'customer', 'customer_name', 'customer_email',
            'status', 'payment_status', 'payment_method',
            'subtotal', 'discount_amount', 'tax_amount', 'shipping_amount', 'total_amount',
            'items_count', 'tracking_number', 'estimated_delivery_date',
            'created_at', 'updated_at'
        ]
    
    def get_customer_name(self, obj):
        user = obj.customer.user
        return f"{user.first_name} {user.last_name}".strip() or user.email
    
    def get_items_count(self, obj):
        return obj.items.count()


class SalesOrderSerializer(serializers.ModelSerializer):
    """Detailed sales order serializer."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.user.phone', read_only=True)
    items = SalesOrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    status_logs = SOStatusLogSerializer(many=True, read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    cancelled_by_name = serializers.SerializerMethodField()
    delivery_info = serializers.SerializerMethodField()
    
    class Meta:
        model = SalesOrder
        fields = [
            'id', 'order_number', 'order_date', 'order_source',
            'vendor', 'vendor_name', 'customer', 'customer_name', 'customer_email', 'customer_phone',
            'status', 'shipping_address', 'billing_address',
            'shipping_address_snapshot', 'billing_address_snapshot',
            'discount_type', 'discount_value', 'coupon_code',
            'subtotal', 'discount_amount', 'tax_amount', 'shipping_amount', 'total_amount',
            'payment_status', 'payment_method',
            'shipping_method', 'tracking_number', 'estimated_delivery_date', 'actual_delivery_date',
            'customer_notes', 'internal_notes',
            'approved_by', 'approved_by_name', 'approved_at',
            'cancelled_by', 'cancelled_by_name', 'cancelled_at', 'cancellation_reason',
            'items', 'items_count', 'status_logs', 'delivery_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'order_date', 'created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        user = obj.customer.user
        return f"{user.first_name} {user.last_name}".strip() or user.email
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.email
        return None
    
    def get_cancelled_by_name(self, obj):
        if obj.cancelled_by:
            return f"{obj.cancelled_by.first_name} {obj.cancelled_by.last_name}".strip() or obj.cancelled_by.email
        return None
    
    def get_delivery_info(self, obj):
        assignment = obj.delivery_assignments.order_by('-created_at').first()
        if assignment:
            return {
                'id': assignment.id,
                'status': assignment.status,
                'agent_name': assignment.delivery_agent.user.get_full_name() if assignment.delivery_agent else None,
                'estimated_delivery': assignment.estimated_delivery_time,
                'actual_delivery': assignment.actual_delivery_time,
            }
        return None


class SalesOrderCreateSerializer(serializers.Serializer):
    """Serializer for creating sales orders."""
    customer = serializers.IntegerField(required=True)
    shipping_address = serializers.IntegerField(required=True)
    billing_address = serializers.IntegerField(required=False, allow_null=True)
    payment_method = serializers.CharField(required=False, allow_blank=True)
    shipping_method = serializers.CharField(required=False, allow_blank=True)
    shipping_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_type = serializers.CharField(required=False, allow_blank=True)
    discount_value = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    items = SalesOrderItemCreateSerializer(many=True, required=True)


class SalesOrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating sales orders."""
    class Meta:
        model = SalesOrder
        fields = [
            'shipping_method', 'tracking_number', 'estimated_delivery_date',
            'internal_notes', 'shipping_amount'
        ]


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for order status updates."""
    status = serializers.CharField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderCancelSerializer(serializers.Serializer):
    """Serializer for cancelling orders."""
    reason = serializers.CharField(required=True, max_length=500)


class AssignDeliverySerializer(serializers.Serializer):
    """Serializer for assigning delivery agent."""
    agent_id = serializers.IntegerField(required=True)
    estimated_delivery_time = serializers.DateTimeField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

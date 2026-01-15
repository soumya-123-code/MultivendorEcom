"""
VendorOrder serializers.
"""
from rest_framework import serializers
from apps.sales_orders.models import VendorOrder, VendorOrderItem, VendorOrderStatusLog


class VendorOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for vendor order items."""

    class Meta:
        model = VendorOrderItem
        fields = [
            'id', 'product', 'variant', 'inventory',
            'product_name', 'product_sku', 'product_image',
            'variant_name', 'variant_attributes',
            'quantity_ordered', 'quantity_packed', 'quantity_shipped',
            'quantity_delivered', 'quantity_cancelled', 'quantity_returned',
            'unit_price', 'cost_price',
            'discount_type', 'discount_value', 'discount_amount',
            'tax_percentage', 'tax_amount',
            'subtotal', 'total',
            'commission_rate', 'commission_amount',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'subtotal', 'total', 'discount_amount', 'tax_amount', 'commission_amount']


class VendorOrderStatusLogSerializer(serializers.ModelSerializer):
    """Serializer for vendor order status logs."""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = VendorOrderStatusLog
        fields = [
            'id', 'old_status', 'new_status', 'notes',
            'changed_by', 'changed_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class VendorOrderSerializer(serializers.ModelSerializer):
    """Base serializer for VendorOrder."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    customer_name = serializers.CharField(source='sales_order.customer.full_name', read_only=True)
    item_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = VendorOrder
        fields = [
            'id', 'order_number', 'sales_order', 'vendor', 'vendor_name',
            'customer_name', 'status', 'payment_status',
            'subtotal', 'discount_amount', 'tax_amount', 'shipping_amount', 'total_amount',
            'commission_rate', 'commission_amount', 'vendor_earning',
            'is_settled', 'settlement',
            'packed_at', 'shipped_at', 'delivered_at',
            'item_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']


class VendorOrderListSerializer(VendorOrderSerializer):
    """List serializer for VendorOrder with minimal data."""

    class Meta(VendorOrderSerializer.Meta):
        fields = [
            'id', 'order_number', 'vendor_name', 'customer_name',
            'status', 'payment_status', 'total_amount',
            'vendor_earning', 'is_settled', 'item_count', 'created_at',
        ]


class VendorOrderDetailSerializer(VendorOrderSerializer):
    """Detail serializer for VendorOrder with full data."""
    items = VendorOrderItemSerializer(many=True, read_only=True)
    status_logs = VendorOrderStatusLogSerializer(many=True, read_only=True)
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    delivery_agent_name = serializers.SerializerMethodField()

    class Meta(VendorOrderSerializer.Meta):
        fields = VendorOrderSerializer.Meta.fields + [
            'items', 'status_logs', 'sales_order_number',
            'vendor_notes', 'internal_notes',
            'delivery_assignment', 'delivery_agent_name',
        ]

    def get_delivery_agent_name(self, obj):
        if obj.delivery_assignment and obj.delivery_assignment.agent:
            return obj.delivery_assignment.agent.user.get_full_name()
        return None

"""
ReturnRequest serializers.
"""
from rest_framework import serializers
from apps.sales_orders.models import ReturnRequest, ReturnItem, ReturnStatusLog


class ReturnItemSerializer(serializers.ModelSerializer):
    """Serializer for return items."""

    class Meta:
        model = ReturnItem
        fields = [
            'id', 'vendor_order_item',
            'quantity_requested', 'quantity_approved',
            'quantity_received', 'quantity_refunded',
            'product_name', 'product_sku', 'variant_name',
            'unit_price', 'refund_amount',
            'inspection_result', 'inspection_notes',
            'reason', 'reason_detail',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'product_name', 'product_sku', 'variant_name', 'unit_price']


class ReturnStatusLogSerializer(serializers.ModelSerializer):
    """Serializer for return status logs."""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = ReturnStatusLog
        fields = [
            'id', 'old_status', 'new_status', 'notes',
            'changed_by', 'changed_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ReturnRequestSerializer(serializers.ModelSerializer):
    """Base serializer for ReturnRequest."""
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    vendor_order_number = serializers.CharField(source='vendor_order.order_number', read_only=True)
    vendor_name = serializers.CharField(source='vendor_order.vendor.store_name', read_only=True)
    item_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'return_number', 'vendor_order', 'vendor_order_number',
            'customer', 'customer_name', 'vendor_name',
            'return_type', 'reason', 'reason_detail', 'status',
            'refund_amount', 'refund_method',
            'pickup_scheduled_date', 'pickup_completed_date',
            'inspection_result',
            'item_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'return_number', 'created_at', 'updated_at']


class ReturnRequestListSerializer(ReturnRequestSerializer):
    """List serializer for ReturnRequest with minimal data."""

    class Meta(ReturnRequestSerializer.Meta):
        fields = [
            'id', 'return_number', 'vendor_order_number',
            'customer_name', 'vendor_name',
            'return_type', 'reason', 'status',
            'refund_amount', 'item_count', 'created_at',
        ]


class ReturnRequestDetailSerializer(ReturnRequestSerializer):
    """Detail serializer for ReturnRequest with full data."""
    items = ReturnItemSerializer(many=True, read_only=True)
    status_logs = ReturnStatusLogSerializer(many=True, read_only=True)
    pickup_address_display = serializers.SerializerMethodField()
    pickup_agent_name = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    rejected_by_name = serializers.CharField(source='rejected_by.get_full_name', read_only=True)
    inspected_by_name = serializers.CharField(source='inspected_by.get_full_name', read_only=True)

    class Meta(ReturnRequestSerializer.Meta):
        fields = ReturnRequestSerializer.Meta.fields + [
            'items', 'status_logs', 'images',
            'pickup_address', 'pickup_address_snapshot', 'pickup_address_display',
            'pickup_agent', 'pickup_agent_name',
            'inspection_notes', 'inspected_by', 'inspected_by_name', 'inspected_at',
            'refund',
            'approved_by', 'approved_by_name', 'approved_at',
            'rejected_by', 'rejected_by_name', 'rejected_at', 'rejection_reason',
            'completed_at',
            'customer_notes', 'vendor_notes', 'internal_notes',
            'replacement_order',
        ]

    def get_pickup_address_display(self, obj):
        if obj.pickup_address_snapshot:
            return obj.pickup_address_snapshot
        if obj.pickup_address:
            return {
                'address_line1': obj.pickup_address.address_line1,
                'address_line2': obj.pickup_address.address_line2,
                'city': obj.pickup_address.city,
                'state': obj.pickup_address.state,
                'postal_code': obj.pickup_address.postal_code,
            }
        return None

    def get_pickup_agent_name(self, obj):
        if obj.pickup_agent and obj.pickup_agent.user:
            return obj.pickup_agent.user.get_full_name()
        return None


class ReturnRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating return requests."""
    items = ReturnItemSerializer(many=True)

    class Meta:
        model = ReturnRequest
        fields = [
            'vendor_order', 'return_type', 'reason', 'reason_detail',
            'images', 'pickup_address', 'customer_notes', 'items',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        return_request = ReturnRequest.objects.create(**validated_data)
        return_request.return_number = return_request.generate_return_number()
        return_request.save(update_fields=['return_number'])

        for item_data in items_data:
            ReturnItem.objects.create(return_request=return_request, **item_data)

        return return_request

"""
Purchase Order serializers.
"""
from rest_framework import serializers
from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, POStatusLog


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for purchase order items."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    quantity_pending = serializers.ReadOnlyField()
    
    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'variant',
            'quantity_ordered', 'quantity_received', 'quantity_cancelled', 
            'quantity_returned', 'quantity_pending',
            'unit_price', 'selling_price',
            'discount_type', 'discount_value', 'discount_amount',
            'tax_percentage', 'tax_amount', 'subtotal', 'total', 'notes'
        ]
        read_only_fields = ['id', 'product_name', 'product_sku', 'quantity_pending']


class PurchaseOrderItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating purchase order items."""
    class Meta:
        model = PurchaseOrderItem
        fields = [
            'product', 'variant', 'quantity_ordered', 'unit_price',
            'selling_price', 'discount_type', 'discount_value', 
            'tax_percentage', 'notes'
        ]


class POStatusLogSerializer(serializers.ModelSerializer):
    """Serializer for PO status logs."""
    changed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = POStatusLog
        fields = ['id', 'old_status', 'new_status', 'notes', 'changed_by', 'changed_by_name', 'created_at']
    
    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip() or obj.changed_by.email
        return None


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    """Serializer for purchase order list view."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'po_date', 'expected_delivery_date',
            'vendor', 'vendor_name', 'supplier', 'supplier_name', 
            'warehouse', 'warehouse_name',
            'status', 'payment_status',
            'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'items_count', 'created_at', 'updated_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Detailed purchase order serializer."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_contact = serializers.CharField(source='supplier.contact_person', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    status_logs = POStatusLogSerializer(many=True, read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    cancelled_by_name = serializers.SerializerMethodField()
    balance_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'po_date', 'expected_delivery_date', 'actual_delivery_date',
            'vendor', 'vendor_name', 'supplier', 'supplier_name', 'supplier_contact',
            'warehouse', 'warehouse_name', 'warehouse_code',
            'status', 'payment_terms', 'payment_status',
            'discount_type', 'discount_value',
            'subtotal', 'discount_amount', 'tax_amount', 'shipping_amount', 
            'total_amount', 'paid_amount', 'balance_amount',
            'notes', 'internal_notes', 'terms_and_conditions',
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            'cancelled_by', 'cancelled_by_name', 'cancelled_at', 'cancellation_reason',
            'items', 'items_count', 'status_logs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'po_number', 'created_at', 'updated_at']
    
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
    
    def get_balance_amount(self, obj):
        return float(obj.total_amount - obj.paid_amount)


class PurchaseOrderCreateSerializer(serializers.Serializer):
    """Serializer for creating purchase orders."""
    supplier = serializers.IntegerField(required=True)
    warehouse = serializers.IntegerField(required=True)
    po_date = serializers.DateField(required=True)
    expected_delivery_date = serializers.DateField(required=False, allow_null=True)
    payment_terms = serializers.CharField(required=False, allow_blank=True)
    discount_type = serializers.CharField(required=False, allow_blank=True)
    discount_value = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms_and_conditions = serializers.CharField(required=False, allow_blank=True)
    items = PurchaseOrderItemCreateSerializer(many=True, required=True)


class PurchaseOrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating purchase orders."""
    class Meta:
        model = PurchaseOrder
        fields = [
            'expected_delivery_date', 'payment_terms', 
            'shipping_amount', 'notes', 'internal_notes', 'terms_and_conditions'
        ]


class POStatusUpdateSerializer(serializers.Serializer):
    """Serializer for PO status updates."""
    notes = serializers.CharField(required=False, allow_blank=True)


class PORejectSerializer(serializers.Serializer):
    """Serializer for rejecting PO."""
    reason = serializers.CharField(required=True, max_length=500)


class POCancelSerializer(serializers.Serializer):
    """Serializer for cancelling PO."""
    reason = serializers.CharField(required=True, max_length=500)


class POReceiveItemSerializer(serializers.Serializer):
    """Serializer for receiving PO items."""
    item_id = serializers.IntegerField(required=True)
    quantity_received = serializers.IntegerField(required=True, min_value=1)
    location_id = serializers.IntegerField(required=False, allow_null=True)
    batch_number = serializers.CharField(required=False, allow_blank=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class POReceiveSerializer(serializers.Serializer):
    """Serializer for receiving items from PO."""
    items = POReceiveItemSerializer(many=True, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

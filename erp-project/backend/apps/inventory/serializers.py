"""
Inventory serializers.
"""
from rest_framework import serializers
from apps.inventory.models import Inventory, InventoryLog


class InventoryLogSerializer(serializers.ModelSerializer):
    """Serializer for inventory logs."""
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = InventoryLog
        fields = [
            'id', 'movement_type', 'quantity', 'quantity_before', 'quantity_after',
            'reference_type', 'reference_id', 'notes', 'created_by_name', 'created_at'
        ]
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None


class InventoryListSerializer(serializers.ModelSerializer):
    """Serializer for inventory list view."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)
    location_code = serializers.CharField(source='location.code', read_only=True, default=None)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    available_quantity = serializers.ReadOnlyField()
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'product_sku', 
            'warehouse', 'warehouse_name', 'warehouse_code',
            'location', 'location_code', 'vendor', 'vendor_name',
            'quantity', 'reserved_quantity', 'available_quantity',
            'stock_status', 'batch_number', 'expiry_date',
            'buy_price', 'sell_price', 'mrp',
            'created_at', 'updated_at'
        ]


class InventorySerializer(serializers.ModelSerializer):
    """Detailed inventory serializer."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_image = serializers.SerializerMethodField()
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)
    location_code = serializers.CharField(source='location.code', read_only=True, default=None)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    available_quantity = serializers.ReadOnlyField()
    recent_logs = serializers.SerializerMethodField()
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'product_image',
            'variant', 'warehouse', 'warehouse_name', 'warehouse_code',
            'location', 'location_code', 'vendor', 'vendor_name',
            'quantity', 'reserved_quantity', 'available_quantity',
            'batch_number', 'serial_number', 'manufacturing_date', 'expiry_date',
            'buy_price', 'sell_price', 'mrp', 'stock_status', 'inward_type',
            'purchase_order', 'purchase_order_item', 'additional_details',
            'recent_logs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_product_image(self, obj):
        if obj.product.images.exists():
            return obj.product.images.first().image.url
        return None
    
    def get_recent_logs(self, obj):
        logs = obj.logs.all()[:5]
        return InventoryLogSerializer(logs, many=True).data


class InventoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating inventory."""
    class Meta:
        model = Inventory
        fields = [
            'product', 'variant', 'warehouse', 'location',
            'quantity', 'batch_number', 'serial_number',
            'manufacturing_date', 'expiry_date',
            'buy_price', 'sell_price', 'mrp', 'inward_type', 'additional_details'
        ]
    
    def validate(self, data):
        # Check for existing inventory
        existing = Inventory.objects.filter(
            product=data.get('product'),
            warehouse=data.get('warehouse'),
            variant=data.get('variant'),
            batch_number=data.get('batch_number')
        ).first()
        
        if existing and not self.instance:
            raise serializers.ValidationError(
                "Inventory already exists for this product/warehouse/batch combination."
            )
        return data


class InventoryUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating inventory."""
    class Meta:
        model = Inventory
        fields = [
            'location', 'batch_number', 'serial_number',
            'manufacturing_date', 'expiry_date',
            'buy_price', 'sell_price', 'mrp', 'additional_details'
        ]


class InventoryAdjustSerializer(serializers.Serializer):
    """Serializer for inventory adjustments."""
    quantity = serializers.IntegerField(required=True, help_text="Positive to add, negative to subtract")
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)


class InventoryTransferSerializer(serializers.Serializer):
    """Serializer for inventory transfers."""
    to_warehouse = serializers.IntegerField(required=True)
    to_location = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(required=True, min_value=1)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)


class InventoryReserveSerializer(serializers.Serializer):
    """Serializer for reserving inventory."""
    quantity = serializers.IntegerField(required=True, min_value=1)
    order_id = serializers.IntegerField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)

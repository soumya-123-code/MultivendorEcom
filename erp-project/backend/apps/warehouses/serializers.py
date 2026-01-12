"""
Warehouse serializers.
"""
from rest_framework import serializers
from apps.warehouses.models import Warehouse, RackShelfLocation


class RackShelfLocationSerializer(serializers.ModelSerializer):
    """Serializer for rack/shelf locations."""
    location_code = serializers.ReadOnlyField()
    
    class Meta:
        model = RackShelfLocation
        fields = [
            'id', 'warehouse', 'name', 'code', 'floor', 'aisle', 
            'rack', 'shelf', 'bin', 'capacity', 'location_code',
            'additional_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RackShelfLocationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating rack/shelf locations."""
    class Meta:
        model = RackShelfLocation
        fields = [
            'name', 'code', 'floor', 'aisle', 'rack', 'shelf', 
            'bin', 'capacity', 'additional_details'
        ]


class WarehouseListSerializer(serializers.ModelSerializer):
    """Serializer for warehouse list view."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    location_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Warehouse
        fields = [
            'id', 'name', 'code', 'city', 'state', 'country', 
            'status', 'warehouse_type', 'vendor_name', 'manager_name',
            'total_capacity', 'used_capacity', 'location_count', 'created_at'
        ]
    
    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}".strip() or obj.manager.email
        return None
    
    def get_location_count(self, obj):
        return obj.locations.count()


class WarehouseSerializer(serializers.ModelSerializer):
    """Detailed warehouse serializer."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    manager_email = serializers.CharField(source='manager.email', read_only=True)
    locations = RackShelfLocationSerializer(many=True, read_only=True)
    location_count = serializers.SerializerMethodField()
    available_capacity = serializers.SerializerMethodField()
    
    class Meta:
        model = Warehouse
        fields = [
            'id', 'vendor', 'vendor_name', 'name', 'code', 
            'address', 'city', 'state', 'country', 'pincode', 'coordinates',
            'manager', 'manager_name', 'manager_email', 'phone', 'email',
            'size', 'total_capacity', 'used_capacity', 'available_capacity',
            'warehouse_type', 'status', 'additional_details',
            'locations', 'location_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}".strip() or obj.manager.email
        return None
    
    def get_location_count(self, obj):
        return obj.locations.count()
    
    def get_available_capacity(self, obj):
        if obj.total_capacity:
            return obj.total_capacity - obj.used_capacity
        return None


class WarehouseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating warehouses."""
    class Meta:
        model = Warehouse
        fields = [
            'name', 'code', 'address', 'city', 'state', 'country', 'pincode',
            'coordinates', 'manager', 'phone', 'email', 'size', 
            'total_capacity', 'warehouse_type', 'status', 'additional_details'
        ]
    
    def validate_code(self, value):
        if Warehouse.objects.filter(code=value).exists():
            raise serializers.ValidationError("Warehouse with this code already exists.")
        return value


class WarehouseUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating warehouses."""
    class Meta:
        model = Warehouse
        fields = [
            'name', 'address', 'city', 'state', 'country', 'pincode',
            'coordinates', 'manager', 'phone', 'email', 'size', 
            'total_capacity', 'warehouse_type', 'status', 'additional_details'
        ]

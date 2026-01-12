"""
Vendor serializers.
"""
from rest_framework import serializers
from apps.vendors.models import Vendor, Supplier
from apps.accounts.serializers.user import UserMinimalSerializer
from core.utils.helpers import slugify_unique


class VendorSerializer(serializers.ModelSerializer):
    """Full vendor serializer."""
    user = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'store_name', 'store_slug', 'store_logo', 'store_banner',
            'description', 'business_email', 'business_phone',
            'business_name', 'business_type', 'tax_id', 'registration_number',
            'address', 'city', 'state', 'country', 'pincode',
            'status', 'approved_at', 'rejection_reason',
            'commission_rate', 'min_order_value', 'max_order_value',
            'rating', 'total_products', 'total_orders', 'total_revenue',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'store_slug', 'status', 'approved_at',
            'rejection_reason', 'rating', 'total_products', 'total_orders',
            'total_revenue', 'created_at', 'updated_at'
        ]


class VendorListSerializer(serializers.ModelSerializer):
    """Minimal vendor serializer for lists."""
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'store_name', 'store_slug', 'store_logo',
            'status', 'rating', 'total_products', 'city', 'state'
        ]


class VendorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating vendor profiles."""
    
    class Meta:
        model = Vendor
        fields = [
            'store_name', 'description', 'business_email', 'business_phone',
            'business_name', 'business_type', 'tax_id', 'registration_number',
            'address', 'city', 'state', 'country', 'pincode',
            'bank_name', 'bank_account_number', 'bank_ifsc', 'bank_account_holder'
        ]
    
    def create(self, validated_data):
        # Generate unique slug
        validated_data['store_slug'] = slugify_unique(
            validated_data['store_name'],
            Vendor,
            'store_slug'
        )
        return super().create(validated_data)


class VendorUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating vendor profiles."""
    
    class Meta:
        model = Vendor
        fields = [
            'store_name', 'store_logo', 'store_banner', 'description',
            'business_email', 'business_phone',
            'address', 'city', 'state', 'country', 'pincode',
            'bank_name', 'bank_account_number', 'bank_ifsc', 'bank_account_holder'
        ]


class VendorApprovalSerializer(serializers.Serializer):
    """Serializer for vendor approval/rejection."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('reason'):
            raise serializers.ValidationError({
                'reason': 'Reason is required for rejection.'
            })
        return data


class SupplierSerializer(serializers.ModelSerializer):
    """Supplier serializer."""
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'vendor', 'name', 'code',
            'contact_person', 'email', 'phone',
            'address', 'city', 'state', 'country', 'pincode',
            'tax_id', 'payment_terms',
            'bank_name', 'bank_account', 'bank_ifsc',
            'status', 'notes',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'vendor', 'created_at', 'updated_at']


class SupplierCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating suppliers."""
    
    class Meta:
        model = Supplier
        fields = [
            'name', 'code', 'contact_person', 'email', 'phone',
            'address', 'city', 'state', 'country', 'pincode',
            'tax_id', 'payment_terms',
            'bank_name', 'bank_account', 'bank_ifsc', 'notes'
        ]

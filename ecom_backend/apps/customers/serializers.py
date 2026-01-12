"""
Customer serializers.
"""
from rest_framework import serializers
from apps.customers.models import Customer, CustomerAddress, Cart, CartItem, Wishlist
from apps.products.serializers import ProductListSerializer


class CustomerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'email', 'full_name',
            'loyalty_points', 'total_spent', 'total_orders',
            'preferred_payment_method', 'marketing_consent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'loyalty_points', 'total_spent', 'total_orders']


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = [
            'id', 'address_type', 'label',
            'full_name', 'phone', 'address_line1', 'address_line2',
            'city', 'state', 'country', 'pincode', 'landmark',
            'is_default', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    variant_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_id', 'variant', 'variant_id',
            'quantity', 'unit_price', 'total_price',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'unit_price', 'total_price', 'created_at', 'updated_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = [
            'id', 'subtotal', 'discount_amount', 'tax_amount', 'total',
            'coupon_code', 'items', 'items_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'total', 'created_at', 'updated_at']
    
    def get_items_count(self, obj):
        return obj.items.count()


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False)
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'created_at']
        read_only_fields = ['id', 'created_at']

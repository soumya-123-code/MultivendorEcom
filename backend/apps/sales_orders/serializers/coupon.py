"""
Coupon serializers.
"""
from rest_framework import serializers
from apps.sales_orders.models import Coupon, CouponUsage


class CouponSerializer(serializers.ModelSerializer):
    """Base serializer for Coupon."""
    is_valid = serializers.BooleanField(read_only=True)
    usage_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'name', 'description',
            'coupon_type', 'value',
            'min_order_value', 'max_discount',
            'valid_from', 'valid_until',
            'usage_limit', 'usage_count', 'per_user_limit',
            'applicability', 'is_active', 'is_public',
            'is_valid', 'usage_remaining',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']

    def get_usage_remaining(self, obj):
        if obj.usage_limit:
            return max(0, obj.usage_limit - obj.usage_count)
        return None


class CouponListSerializer(CouponSerializer):
    """List serializer for Coupon with minimal data."""

    class Meta(CouponSerializer.Meta):
        fields = [
            'id', 'code', 'name', 'coupon_type', 'value',
            'min_order_value', 'max_discount',
            'valid_from', 'valid_until',
            'is_active', 'is_valid', 'usage_count', 'usage_remaining',
        ]


class CouponDetailSerializer(CouponSerializer):
    """Detail serializer for Coupon with full data."""
    applicable_categories_data = serializers.SerializerMethodField()
    applicable_products_data = serializers.SerializerMethodField()
    applicable_vendors_data = serializers.SerializerMethodField()
    applicable_brands_data = serializers.SerializerMethodField()

    class Meta(CouponSerializer.Meta):
        fields = CouponSerializer.Meta.fields + [
            'applicable_categories', 'applicable_categories_data',
            'applicable_products', 'applicable_products_data',
            'applicable_vendors', 'applicable_vendors_data',
            'applicable_brands', 'applicable_brands_data',
            'target_user_ids', 'new_users_only',
            'buy_quantity', 'get_quantity', 'get_product',
            'terms_and_conditions',
        ]

    def get_applicable_categories_data(self, obj):
        return [{'id': c.id, 'name': c.name} for c in obj.applicable_categories.all()]

    def get_applicable_products_data(self, obj):
        return [{'id': p.id, 'name': p.name} for p in obj.applicable_products.all()[:10]]

    def get_applicable_vendors_data(self, obj):
        return [{'id': v.id, 'name': v.store_name} for v in obj.applicable_vendors.all()]

    def get_applicable_brands_data(self, obj):
        return [{'id': b.id, 'name': b.name} for b in obj.applicable_brands.all()]


class CouponCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating coupons."""

    class Meta:
        model = Coupon
        fields = [
            'code', 'name', 'description',
            'coupon_type', 'value',
            'min_order_value', 'max_discount',
            'valid_from', 'valid_until',
            'usage_limit', 'per_user_limit',
            'applicability',
            'applicable_categories', 'applicable_products',
            'applicable_vendors', 'applicable_brands',
            'target_user_ids', 'new_users_only',
            'buy_quantity', 'get_quantity', 'get_product',
            'is_active', 'is_public',
            'terms_and_conditions',
        ]


class CouponUsageSerializer(serializers.ModelSerializer):
    """Serializer for coupon usage records."""
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    coupon_name = serializers.CharField(source='coupon.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    order_number = serializers.CharField(source='sales_order.order_number', read_only=True)

    class Meta:
        model = CouponUsage
        fields = [
            'id', 'coupon', 'coupon_code', 'coupon_name',
            'user', 'user_email',
            'sales_order', 'order_number',
            'discount_amount', 'used_at',
        ]
        read_only_fields = ['id', 'used_at']


class CouponValidateSerializer(serializers.Serializer):
    """Serializer for validating coupon codes."""
    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, attrs):
        code = attrs.get('code')
        try:
            coupon = Coupon.objects.get(code__iexact=code)
            attrs['coupon'] = coupon
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({'code': 'Invalid coupon code'})
        return attrs

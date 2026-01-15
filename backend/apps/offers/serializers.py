from rest_framework import serializers
from .models import Coupon

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'
        read_only_fields = ('usage_count', 'created_at', 'updated_at')

class CouponValidationSerializer(serializers.Serializer):
    """Serializer for validating coupon codes."""
    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2)

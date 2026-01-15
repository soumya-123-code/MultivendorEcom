"""
Serializers for settings app.
"""
from rest_framework import serializers
from .models import (
    StoreSettings, CurrencySettings, StoreLocation,
    ShippingMethod, TaxSettings, CheckoutSettings,
    InvoiceSettings, ReturnPolicy, ProductComparison
)


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = '__all__'


class CurrencySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurrencySettings
        fields = '__all__'


class StoreLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreLocation
        fields = '__all__'


class ShippingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethod
        fields = '__all__'


class TaxSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxSettings
        fields = '__all__'


class CheckoutSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckoutSettings
        fields = '__all__'


class InvoiceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceSettings
        fields = '__all__'


class ReturnPolicySerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ReturnPolicy
        fields = '__all__'


class ProductComparisonSerializer(serializers.ModelSerializer):
    products_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductComparison
        fields = '__all__'
    
    def get_products_detail(self, obj):
        from apps.products.serializers import ProductSerializer
        return ProductSerializer(obj.products.all(), many=True).data

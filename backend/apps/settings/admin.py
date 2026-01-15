"""
Admin configuration for settings app.
"""
from django.contrib import admin
from .models import (
    StoreSettings, CurrencySettings, StoreLocation,
    ShippingMethod, TaxSettings, CheckoutSettings,
    InvoiceSettings, ReturnPolicy, ProductComparison
)


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ['store_name', 'company_name', 'email', 'phone']


@admin.register(CurrencySettings)
class CurrencySettingsAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'symbol', 'is_default', 'exchange_rate']
    list_filter = ['is_default']


@admin.register(StoreLocation)
class StoreLocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'state', 'phone', 'is_active']
    list_filter = ['is_active', 'state']


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ['name', 'base_rate', 'min_delivery_days', 'max_delivery_days', 'is_active']
    list_filter = ['is_active']
    ordering = ['display_order']


@admin.register(TaxSettings)
class TaxSettingsAdmin(admin.ModelAdmin):
    list_display = ['name', 'percentage', 'country', 'state', 'is_active']
    list_filter = ['is_active']
    ordering = ['name']


@admin.register(CheckoutSettings)
class CheckoutSettingsAdmin(admin.ModelAdmin):
    list_display = ['id', 'allow_guest_checkout', 'min_order_value', 'require_terms_agreement']


@admin.register(InvoiceSettings)
class InvoiceSettingsAdmin(admin.ModelAdmin):
    list_display = ['invoice_number_prefix', 'invoice_number_digits']


@admin.register(ReturnPolicy)
class ReturnPolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'return_window_days', 'requires_approval', 'is_active']
    list_filter = ['is_active']


@admin.register(ProductComparison)
class ProductComparisonAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'created_at']
    list_filter = ['created_at']

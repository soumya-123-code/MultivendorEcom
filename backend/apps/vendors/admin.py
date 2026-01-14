"""
Admin configuration for vendors app.
"""
from django.contrib import admin
from apps.vendors.models import Vendor, Supplier
from apps.vendors.models.vendor import VendorStaff


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = [
        'store_name', 'user', 'status', 'city', 'state',
        'rating', 'total_products', 'total_orders', 'created_at'
    ]
    list_filter = ['status', 'state', 'business_type', 'created_at']
    search_fields = ['store_name', 'user__email', 'business_name', 'city']
    readonly_fields = ['store_slug', 'rating', 'total_products', 'total_orders', 'total_revenue']
    raw_id_fields = ['user', 'approved_by']
    
    fieldsets = (
        ('Store Info', {
            'fields': ('user', 'store_name', 'store_slug', 'store_logo', 'store_banner', 'description')
        }),
        ('Contact', {
            'fields': ('business_email', 'business_phone')
        }),
        ('Business Details', {
            'fields': ('business_name', 'business_type', 'tax_id', 'registration_number')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'country', 'pincode')
        }),
        ('Bank Details', {
            'fields': ('bank_name', 'bank_account_number', 'bank_ifsc', 'bank_account_holder')
        }),
        ('Status', {
            'fields': ('status', 'approved_by', 'approved_at', 'rejection_reason', 'is_active')
        }),
        ('Settings', {
            'fields': ('commission_rate', 'min_order_value', 'max_order_value')
        }),
        ('Stats', {
            'fields': ('rating', 'total_products', 'total_orders', 'total_revenue')
        }),
    )


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'contact_person', 'email', 'phone', 'status']
    list_filter = ['status', 'payment_terms', 'vendor']
    search_fields = ['name', 'contact_person', 'email']
    raw_id_fields = ['vendor']


@admin.register(VendorStaff)
class VendorStaffAdmin(admin.ModelAdmin):
    list_display = ['user', 'vendor', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['user__email', 'vendor__store_name']
    raw_id_fields = ['user', 'vendor']

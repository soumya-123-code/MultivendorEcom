from django.contrib import admin
from .models import Coupon

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active')
    search_fields = ('code',)
    list_filter = ('is_active', 'discount_type', 'start_date', 'end_date')

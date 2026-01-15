from django.contrib import admin
from .models import ReturnRequest, ReturnItem

class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 0

@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'customer', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    inlines = [ReturnItemInline]

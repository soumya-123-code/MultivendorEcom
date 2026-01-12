from django.contrib import admin
from apps.inventory.models import Inventory, InventoryLog


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'warehouse', 'quantity', 'reserved_quantity', 'stock_status']
    list_filter = ['stock_status', 'warehouse', 'vendor']
    search_fields = ['product__name', 'batch_number']
    raw_id_fields = ['product', 'variant', 'warehouse', 'location', 'vendor']


@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ['product', 'warehouse', 'movement_type', 'quantity', 'created_at']
    list_filter = ['movement_type', 'warehouse']
    search_fields = ['product__name']
    raw_id_fields = ['inventory', 'product', 'warehouse', 'vendor']

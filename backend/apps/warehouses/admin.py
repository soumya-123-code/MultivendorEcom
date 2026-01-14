from django.contrib import admin
from apps.warehouses.models import Warehouse, RackShelfLocation


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'vendor', 'city', 'status', 'warehouse_type']
    list_filter = ['status', 'warehouse_type', 'state']
    search_fields = ['name', 'code']
    raw_id_fields = ['vendor', 'manager']


@admin.register(RackShelfLocation)
class RackShelfLocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'warehouse', 'floor', 'aisle', 'rack', 'shelf']
    list_filter = ['warehouse']
    search_fields = ['name', 'code']
    raw_id_fields = ['warehouse']

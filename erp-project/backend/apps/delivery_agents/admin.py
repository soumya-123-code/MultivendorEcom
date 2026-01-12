from django.contrib import admin
from apps.delivery_agents.models import DeliveryAgent, DeliveryAssignment, DeliveryStatusLog, DeliveryProof


@admin.register(DeliveryAgent)
class DeliveryAgentAdmin(admin.ModelAdmin):
    list_display = ['user', 'vendor', 'status', 'is_available', 'vehicle_type', 'total_deliveries', 'rating']
    list_filter = ['status', 'is_available', 'vehicle_type', 'vendor']
    search_fields = ['user__email', 'vehicle_number']
    raw_id_fields = ['user', 'vendor', 'approved_by']


@admin.register(DeliveryAssignment)
class DeliveryAssignmentAdmin(admin.ModelAdmin):
    list_display = ['sales_order', 'delivery_agent', 'status', 'delivery_attempts', 'assigned_at']
    list_filter = ['status']
    search_fields = ['sales_order__order_number']
    raw_id_fields = ['sales_order', 'delivery_agent', 'assigned_by']


@admin.register(DeliveryStatusLog)
class DeliveryStatusLogAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'old_status', 'new_status', 'updated_by', 'created_at']
    raw_id_fields = ['assignment', 'updated_by']


@admin.register(DeliveryProof)
class DeliveryProofAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'proof_type', 'captured_at']
    list_filter = ['proof_type']
    raw_id_fields = ['assignment']

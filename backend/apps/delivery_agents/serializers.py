"""
Delivery Agent and Delivery serializers.
"""
from rest_framework import serializers
from apps.delivery_agents.models import DeliveryAgent, DeliveryAssignment, DeliveryStatusLog, DeliveryProof


class DeliveryAgentListSerializer(serializers.ModelSerializer):
    """Serializer for delivery agent list view."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True, default=None)
    
    class Meta:
        model = DeliveryAgent
        fields = [
            'id', 'user', 'user_email', 'user_name', 'user_phone',
            'vendor', 'vendor_name', 'vehicle_type', 'vehicle_number',
            'city', 'state', 'status', 'is_available',
            'total_deliveries', 'successful_deliveries', 'rating',
            'created_at'
        ]
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class DeliveryAgentSerializer(serializers.ModelSerializer):
    """Detailed delivery agent serializer."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True, default=None)
    approved_by_name = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryAgent
        fields = [
            'id', 'user', 'user_email', 'user_name', 'user_phone',
            'vendor', 'vendor_name',
            'date_of_birth', 'gender', 'id_type', 'id_number', 'id_document',
            'vehicle_type', 'vehicle_number', 'vehicle_document',
            'address', 'city', 'state', 'pincode',
            'bank_name', 'bank_account_number', 'bank_ifsc',
            'status', 'approved_by', 'approved_by_name', 'approved_at',
            'is_available', 'current_location', 'last_location_update',
            'total_deliveries', 'successful_deliveries', 'failed_deliveries',
            'rating', 'success_rate',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.email
        return None
    
    def get_success_rate(self, obj):
        if obj.total_deliveries > 0:
            return round((obj.successful_deliveries / obj.total_deliveries) * 100, 1)
        return 0


class DeliveryAgentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating delivery agent profile."""
    class Meta:
        model = DeliveryAgent
        fields = [
            'date_of_birth', 'gender', 'id_type', 'id_number', 'id_document',
            'vehicle_type', 'vehicle_number', 'vehicle_document',
            'address', 'city', 'state', 'pincode',
            'bank_name', 'bank_account_number', 'bank_ifsc'
        ]


class DeliveryAgentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating delivery agent."""
    class Meta:
        model = DeliveryAgent
        fields = [
            'date_of_birth', 'gender', 'vehicle_type', 'vehicle_number',
            'vehicle_document', 'address', 'city', 'state', 'pincode',
            'bank_name', 'bank_account_number', 'bank_ifsc'
        ]


class DeliveryStatusLogSerializer(serializers.ModelSerializer):
    """Serializer for delivery status logs."""
    updated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryStatusLog
        fields = ['id', 'old_status', 'new_status', 'notes', 'location', 
                  'updated_by', 'updated_by_name', 'created_at']
    
    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.email
        return None


class DeliveryProofSerializer(serializers.ModelSerializer):
    """Serializer for delivery proofs."""
    sales_order_number = serializers.CharField(source='assignment.sales_order.order_number', read_only=True)
    
    class Meta:
        model = DeliveryProof
        fields = ['id', 'assignment', 'sales_order_number', 'proof_type', 'proof_data', 'captured_at', 'location', 'created_at']


class DeliveryAssignmentListSerializer(serializers.ModelSerializer):
    """Serializer for delivery assignment list view."""
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    agent_name = serializers.SerializerMethodField()
    agent_phone = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryAssignment
        fields = [
            'id', 'sales_order', 'sales_order_number',
            'delivery_agent', 'agent_name', 'agent_phone',
            'delivery_contact_name', 'delivery_contact_phone', 'customer_name',
            'status', 'delivery_attempts', 'cod_amount', 'cod_collected',
            'estimated_delivery_time', 'actual_delivery_time',
            'assigned_at', 'created_at'
        ]
    
    def get_agent_name(self, obj):
        if obj.delivery_agent:
            return f"{obj.delivery_agent.user.first_name} {obj.delivery_agent.user.last_name}".strip() or obj.delivery_agent.user.email
        return None
    
    def get_agent_phone(self, obj):
        if obj.delivery_agent:
            return obj.delivery_agent.user.phone
        return None
    
    def get_customer_name(self, obj):
        return obj.delivery_contact_name


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    """Detailed delivery assignment serializer."""
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    order_total = serializers.DecimalField(source='sales_order.total_amount', max_digits=12, decimal_places=2, read_only=True)
    agent_name = serializers.SerializerMethodField()
    agent_phone = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    status_logs = DeliveryStatusLogSerializer(many=True, read_only=True)
    proofs = DeliveryProofSerializer(many=True, read_only=True)
    
    class Meta:
        model = DeliveryAssignment
        fields = [
            'id', 'sales_order', 'sales_order_number', 'order_total',
            'delivery_agent', 'agent_name', 'agent_phone',
            'pickup_address', 'pickup_contact_name', 'pickup_contact_phone',
            'delivery_address', 'delivery_contact_name', 'delivery_contact_phone',
            'delivery_instructions',
            'estimated_pickup_time', 'actual_pickup_time',
            'estimated_delivery_time', 'actual_delivery_time',
            'status', 'delivery_attempts', 'max_attempts',
            'delivery_fee', 'cod_amount', 'cod_collected',
            'notes', 'failure_reason',
            'assigned_by', 'assigned_by_name', 'assigned_at',
            'status_logs', 'proofs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_agent_name(self, obj):
        if obj.delivery_agent:
            return f"{obj.delivery_agent.user.first_name} {obj.delivery_agent.user.last_name}".strip() or obj.delivery_agent.user.email
        return None
    
    def get_agent_phone(self, obj):
        if obj.delivery_agent:
            return obj.delivery_agent.user.phone
        return None
    
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}".strip() or obj.assigned_by.email
        return None


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating delivery status."""
    notes = serializers.CharField(required=False, allow_blank=True)
    location = serializers.JSONField(required=False, allow_null=True)


class DeliveryCompleteSerializer(serializers.Serializer):
    """Serializer for completing delivery."""
    proof_type = serializers.ChoiceField(choices=['photo', 'signature', 'otp', 'document'], required=True)
    proof_data = serializers.JSONField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    location = serializers.JSONField(required=False, allow_null=True)


class DeliveryFailSerializer(serializers.Serializer):
    """Serializer for failed delivery."""
    reason = serializers.CharField(required=True, max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True)
    location = serializers.JSONField(required=False, allow_null=True)


class CollectCODSerializer(serializers.Serializer):
    """Serializer for COD collection."""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class AvailabilitySerializer(serializers.Serializer):
    """Serializer for setting availability."""
    is_available = serializers.BooleanField(required=True)


class LocationUpdateSerializer(serializers.Serializer):
    """Serializer for location updates."""
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)

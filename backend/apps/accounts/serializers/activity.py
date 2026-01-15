from rest_framework import serializers
from apps.accounts.models import ActivityLog
from apps.accounts.serializers.user import UserListSerializer

class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs."""
    user = UserListSerializer(read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'action', 'action_type', 
            'entity_type', 'entity_id', 'ip_address', 
            'user_agent', 'created_at', 'extra_data'
        ]
        read_only_fields = fields

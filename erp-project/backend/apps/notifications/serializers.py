"""
Notification serializers.
"""
from rest_framework import serializers
from apps.notifications.models import Notification, NotificationTemplate


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'type', 'title', 'message', 'data',
            'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class NotificationListSerializer(serializers.ModelSerializer):
    """Serializer for notification list view."""
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'is_read', 'created_at'
        ]


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications (admin use)."""
    class Meta:
        model = Notification
        fields = ['user', 'type', 'title', 'message', 'data']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for notification templates."""
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'name', 'type', 'title_template', 'message_template', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read."""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of notification IDs to mark as read. If empty, marks all as read."
    )

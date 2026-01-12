"""
User Profile serializers.
"""
from rest_framework import serializers
from apps.accounts.models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    class Meta:
        model = UserProfile
        fields = [
            'date_of_birth', 'gender', 'bio',
            'social_links', 'preferences',
            'email_notifications', 'sms_notifications', 'push_notifications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

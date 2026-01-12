"""
User serializers.
"""
from rest_framework import serializers
from apps.accounts.models import User
from core.utils.choices import RoleChoices


class UserSerializer(serializers.ModelSerializer):
    """Full user serializer."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name', 'full_name',
            'role', 'avatar', 'is_active', 'is_verified',
            'language', 'timezone', 'currency',
            'date_joined', 'last_login', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login', 'updated_at']


class UserListSerializer(serializers.ModelSerializer):
    """Minimal user serializer for lists."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 
            'is_active', 'is_verified', 'date_joined'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users (admin only)."""
    
    class Meta:
        model = User
        fields = [
            'email', 'phone', 'first_name', 'last_name',
            'role', 'is_active'
        ]
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value.lower().strip()
    
    def validate_role(self, value):
        # Only super_admin can create super_admin users
        request = self.context.get('request')
        if request and value == RoleChoices.SUPER_ADMIN:
            if request.user.role != RoleChoices.SUPER_ADMIN:
                raise serializers.ValidationError(
                    "Only super admins can create super admin users."
                )
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = [
            'phone', 'first_name', 'last_name',
            'avatar', 'language', 'timezone', 'currency'
        ]


class ChangeRoleSerializer(serializers.Serializer):
    """Serializer for changing user role."""
    role = serializers.ChoiceField(choices=RoleChoices.CHOICES)
    
    def validate_role(self, value):
        request = self.context.get('request')
        if request and value == RoleChoices.SUPER_ADMIN:
            if request.user.role != RoleChoices.SUPER_ADMIN:
                raise serializers.ValidationError(
                    "Only super admins can assign super admin role."
                )
        return value


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for nested relationships."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

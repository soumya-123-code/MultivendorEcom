"""
Authentication serializers for OTP-based login.
"""
from rest_framework import serializers
from django.core.validators import EmailValidator


class RequestOTPSerializer(serializers.Serializer):
    """Serializer for requesting OTP."""
    email = serializers.EmailField(
        validators=[EmailValidator()],
        help_text='Email address to send OTP to'
    )
    
    def validate_email(self, value):
        return value.lower().strip()


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP and getting tokens."""
    email = serializers.EmailField(
        validators=[EmailValidator()],
        help_text='Email address'
    )
    otp = serializers.CharField(
        min_length=6,
        max_length=6,
        help_text='6-digit OTP'
    )
    
    def validate_email(self, value):
        return value.lower().strip()
    
    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return value


class TokenRefreshSerializer(serializers.Serializer):
    """Serializer for refreshing JWT tokens."""
    refresh = serializers.CharField(help_text='Refresh token')


class LogoutSerializer(serializers.Serializer):
    """Serializer for logout (token blacklisting)."""
    refresh = serializers.CharField(
        required=False,
        help_text='Refresh token to blacklist'
    )


class AuthResponseSerializer(serializers.Serializer):
    """Serializer for authentication response."""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = serializers.DictField()


class OTPResponseSerializer(serializers.Serializer):
    """Serializer for OTP request response."""
    message = serializers.CharField()
    email = serializers.EmailField()
    otp = serializers.CharField(required=False, help_text='Only in development mode')
    expires_in = serializers.IntegerField(help_text='OTP expiry time in seconds')

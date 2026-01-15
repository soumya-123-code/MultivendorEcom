from rest_framework import serializers
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from apps.accounts.serializers.user import UserSerializer

class OutstandingTokenSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = OutstandingToken
        fields = ['id', 'user', 'jti', 'token', 'created_at', 'expires_at']
        read_only_fields = ['id', 'user', 'jti', 'token', 'created_at', 'expires_at']

class BlacklistedTokenSerializer(serializers.ModelSerializer):
    token = OutstandingTokenSerializer(read_only=True)
    
    class Meta:
        model = BlacklistedToken
        fields = ['id', 'token', 'blacklisted_at']
        read_only_fields = ['id', 'token', 'blacklisted_at']

class BlacklistTokenCreateSerializer(serializers.Serializer):
    refresh = serializers.CharField()

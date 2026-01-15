from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from core.permissions import IsAdmin

from apps.accounts.serializers.token import (
    OutstandingTokenSerializer,
    BlacklistedTokenSerializer,
    BlacklistTokenCreateSerializer
)

class OutstandingTokenViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing outstanding tokens.
    Only Admins can view.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = OutstandingToken.objects.select_related('user').all()
    serializer_class = OutstandingTokenSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__email', 'user__first_name', 'jti']
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return OutstandingToken.objects.select_related('user').all()

class BlacklistedTokenViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing blacklisted tokens.
    Only Admins can view and blacklist.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = BlacklistedToken.objects.select_related('token', 'token__user').all()
    serializer_class = BlacklistedTokenSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['blacklisted_at']
    ordering = ['-blacklisted_at']
    http_method_names = ['get', 'post', 'delete']

    def create(self, request, *args, **kwargs):
        serializer = BlacklistTokenCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            refresh = RefreshToken(serializer.validated_data['refresh'])
            refresh.blacklist()
            return Response({'success': True, 'message': 'Token blacklisted successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

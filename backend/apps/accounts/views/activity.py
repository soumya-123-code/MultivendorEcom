from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from apps.accounts.models import ActivityLog
from apps.accounts.serializers.activity import ActivityLogSerializer
from core.permissions import IsAdmin

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing system activity logs (Admin only).
    """
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action_type', 'entity_type', 'user']
    search_fields = ['action', 'user__email', 'ip_address']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    @extend_schema(tags=['Activity Logs'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

"""
Notification views.
"""
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from apps.notifications.models import Notification, NotificationTemplate
from apps.notifications.serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    NotificationCreateSerializer,
    NotificationTemplateSerializer,
    MarkReadSerializer,
)
from core.permissions import IsAdmin


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for user notifications."""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']
    filterset_fields = ['type', 'is_read']
    http_method_names = ['get', 'post', 'delete']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NotificationListSerializer
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    @extend_schema(tags=['Notifications'])
    def list(self, request, *args, **kwargs):
        """List user's notifications."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Notifications'])
    def retrieve(self, request, *args, **kwargs):
        """Get notification details and mark as read."""
        instance = self.get_object()
        if not instance.is_read:
            instance.mark_as_read()
        return Response({
            'success': True,
            'data': NotificationSerializer(instance).data
        })
    
    @extend_schema(tags=['Notifications'])
    def destroy(self, request, *args, **kwargs):
        """Delete a notification."""
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Notification deleted.'
        }, status=status.HTTP_204_NO_CONTENT)
    
    @extend_schema(tags=['Notifications'])
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({
            'success': True,
            'data': NotificationSerializer(notification).data
        })
    
    @extend_schema(tags=['Notifications'])
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data.get('notification_ids', [])
        
        queryset = self.get_queryset().filter(is_read=False)
        if notification_ids:
            queryset = queryset.filter(id__in=notification_ids)
        
        count = queryset.count()
        queryset.update(is_read=True, read_at=timezone.now())
        
        return Response({
            'success': True,
            'message': f'{count} notifications marked as read.'
        })
    
    @extend_schema(tags=['Notifications'])
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications."""
        queryset = self.get_queryset().filter(is_read=False)
        serializer = NotificationListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'data': serializer.data
        })
    
    @extend_schema(tags=['Notifications'])
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get notification counts."""
        queryset = self.get_queryset()
        return Response({
            'success': True,
            'data': {
                'total': queryset.count(),
                'unread': queryset.filter(is_read=False).count(),
            }
        })
    
    @extend_schema(tags=['Notifications'])
    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        """Delete all notifications."""
        count = self.get_queryset().count()
        self.get_queryset().delete()
        return Response({
            'success': True,
            'message': f'{count} notifications deleted.'
        })


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for notification templates (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    
    @extend_schema(tags=['Notification Templates (Admin)'])
    def list(self, request, *args, **kwargs):
        """List notification templates."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Notification Templates (Admin)'])
    def create(self, request, *args, **kwargs):
        """Create notification template."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        template = NotificationTemplate.objects.create(**serializer.validated_data)
        return Response({
            'success': True,
            'data': NotificationTemplateSerializer(template).data
        }, status=status.HTTP_201_CREATED)


class SendNotificationView(APIView):
    """View for sending notifications (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @extend_schema(request=NotificationCreateSerializer, tags=['Notifications (Admin)'])
    def post(self, request):
        """Send notification to a user."""
        serializer = NotificationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification = Notification.objects.create(**serializer.validated_data)
        
        return Response({
            'success': True,
            'data': NotificationSerializer(notification).data
        }, status=status.HTTP_201_CREATED)


class BroadcastNotificationView(APIView):
    """View for broadcasting notifications to multiple users."""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @extend_schema(tags=['Notifications (Admin)'])
    def post(self, request):
        """Broadcast notification to users."""
        from apps.accounts.models import User
        
        notification_type = request.data.get('type', 'system')
        title = request.data.get('title')
        message = request.data.get('message')
        data = request.data.get('data')
        
        # Target filters
        role = request.data.get('role')  # Filter by role
        user_ids = request.data.get('user_ids', [])  # Specific user IDs
        
        if not title or not message:
            return Response({
                'success': False,
                'error': {'message': 'title and message are required.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get target users
        if user_ids:
            users = User.objects.filter(id__in=user_ids, is_active=True)
        elif role:
            users = User.objects.filter(role=role, is_active=True)
        else:
            users = User.objects.filter(is_active=True)
        
        # Create notifications
        notifications = [
            Notification(
                user=user,
                type=notification_type,
                title=title,
                message=message,
                data=data
            )
            for user in users
        ]
        
        Notification.objects.bulk_create(notifications)
        
        return Response({
            'success': True,
            'message': f'Notification sent to {len(notifications)} users.'
        }, status=status.HTTP_201_CREATED)

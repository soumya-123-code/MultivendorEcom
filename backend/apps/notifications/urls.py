"""
Notification URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.notifications.views import (
    NotificationViewSet,
    NotificationTemplateViewSet,
    SendNotificationView,
    BroadcastNotificationView,
)

router = DefaultRouter()
router.register('templates', NotificationTemplateViewSet, basename='notification-templates')
router.register('', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('send/', SendNotificationView.as_view(), name='send-notification'),
    path('broadcast/', BroadcastNotificationView.as_view(), name='broadcast-notification'),
    path('', include(router.urls)),
]

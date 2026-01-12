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
router.register('', NotificationViewSet, basename='notifications')

template_router = DefaultRouter()
template_router.register('templates', NotificationTemplateViewSet, basename='notification-templates')

urlpatterns = [
    path('send/', SendNotificationView.as_view(), name='send-notification'),
    path('broadcast/', BroadcastNotificationView.as_view(), name='broadcast-notification'),
    path('', include(router.urls)),
    path('', include(template_router.urls)),
]

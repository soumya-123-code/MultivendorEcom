"""
Delivery Agent URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.delivery_agents.views import (
    DeliveryAgentViewSet,
    CurrentDeliveryAgentView,
    DeliveryAgentAvailabilityView,
    DeliveryAgentLocationView,
    DeliveryAgentStatsView,
)

router = DefaultRouter()
router.register('', DeliveryAgentViewSet, basename='delivery-agents')

urlpatterns = [
    path('me/', CurrentDeliveryAgentView.as_view(), name='current-delivery-agent'),
    path('me/availability/', DeliveryAgentAvailabilityView.as_view(), name='delivery-agent-availability'),
    path('me/location/', DeliveryAgentLocationView.as_view(), name='delivery-agent-location'),
    path('me/stats/', DeliveryAgentStatsView.as_view(), name='delivery-agent-stats'),
    path('', include(router.urls)),
]

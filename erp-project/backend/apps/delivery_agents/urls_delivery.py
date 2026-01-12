"""
Delivery URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.delivery_agents.views_delivery import DeliveryViewSet

router = DefaultRouter()
router.register('', DeliveryViewSet, basename='deliveries')

urlpatterns = [
    path('', include(router.urls)),
]

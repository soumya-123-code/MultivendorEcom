"""
Inventory URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.inventory.views import InventoryViewSet, InventoryLogViewSet

router = DefaultRouter()
router.register('logs', InventoryLogViewSet, basename='inventory-logs')
router.register('', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('', include(router.urls)),
]

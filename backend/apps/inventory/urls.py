"""
Inventory URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.inventory.views import InventoryViewSet

router = DefaultRouter()
router.register('', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('', include(router.urls)),
]

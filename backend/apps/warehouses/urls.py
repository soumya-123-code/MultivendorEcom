"""
Warehouse URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.warehouses.views import WarehouseViewSet, RackShelfLocationViewSet

router = DefaultRouter()
router.register('', WarehouseViewSet, basename='warehouses')

location_router = DefaultRouter()
location_router.register('locations', RackShelfLocationViewSet, basename='locations')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(location_router.urls)),
]

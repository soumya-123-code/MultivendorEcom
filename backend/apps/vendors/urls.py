"""
Vendor URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.vendors.views import VendorViewSet, CurrentVendorView, SupplierViewSet

router = DefaultRouter()
router.register('', VendorViewSet, basename='vendors')

supplier_router = DefaultRouter()
supplier_router.register('suppliers', SupplierViewSet, basename='suppliers')

urlpatterns = [
    path('me/', CurrentVendorView.as_view(), name='current-vendor'),
    path('', include(router.urls)),
    path('', include(supplier_router.urls)),
]

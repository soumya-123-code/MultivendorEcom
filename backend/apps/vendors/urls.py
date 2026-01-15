"""
Vendor URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.vendors.views import VendorViewSet, CurrentVendorView, SupplierViewSet, VendorStaffViewSet

router = DefaultRouter()
router.register('suppliers', SupplierViewSet, basename='suppliers')
router.register('staff', VendorStaffViewSet, basename='vendor-staff')

vendor_router = DefaultRouter()
vendor_router.register('', VendorViewSet, basename='vendors')

urlpatterns = [
    path('me/', CurrentVendorView.as_view(), name='current-vendor'),
    path('', include(router.urls)),
    path('', include(vendor_router.urls)),
]

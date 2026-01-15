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

settlement_router = DefaultRouter()
settlement_router.register('settlements', VendorSettlementViewSet, basename='settlements')

payout_router = DefaultRouter()
payout_router.register('payouts', VendorPayoutViewSet, basename='payouts')

ledger_router = DefaultRouter()
ledger_router.register('ledger', VendorLedgerViewSet, basename='ledger')

commission_router = DefaultRouter()
commission_router.register('commissions', CommissionRecordViewSet, basename='commissions')

urlpatterns = [
    path('me/', CurrentVendorView.as_view(), name='current-vendor'),
    path('', include(router.urls)),
    path('', include(vendor_router.urls)),
]

"""
Vendor URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.vendors.views import VendorViewSet, CurrentVendorView, SupplierViewSet
from apps.vendors.views.settlement_views import (
    VendorSettlementViewSet,
    VendorPayoutViewSet,
    VendorLedgerViewSet,
    CommissionRecordViewSet,
)

router = DefaultRouter()
router.register('', VendorViewSet, basename='vendors')

supplier_router = DefaultRouter()
supplier_router.register('suppliers', SupplierViewSet, basename='suppliers')

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
    path('', include(supplier_router.urls)),
    path('', include(settlement_router.urls)),
    path('', include(payout_router.urls)),
    path('', include(ledger_router.urls)),
    path('', include(commission_router.urls)),
]

"""
Purchase Order URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.purchase_orders.views import PurchaseOrderViewSet

router = DefaultRouter()
router.register('', PurchaseOrderViewSet, basename='purchase-orders')

urlpatterns = [
    path('', include(router.urls)),
]

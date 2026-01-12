"""
Payment URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.payments.views import PaymentViewSet, RefundViewSet

router = DefaultRouter()
router.register('', PaymentViewSet, basename='payments')

refund_router = DefaultRouter()
refund_router.register('refunds', RefundViewSet, basename='refunds')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(refund_router.urls)),
]

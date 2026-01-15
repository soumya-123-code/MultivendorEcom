"""
Delivery Proof URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.delivery_agents.views_delivery import DeliveryProofViewSet

router = DefaultRouter()
router.register('', DeliveryProofViewSet, basename='delivery-proofs')

urlpatterns = [
    path('', include(router.urls)),
]

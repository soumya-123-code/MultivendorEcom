"""
Customer URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.customers.views import (
    CustomerViewSet,
    CurrentCustomerView,
    CustomerAddressViewSet,
    WishlistViewSet,
)

router = DefaultRouter()
router.register('', CustomerViewSet, basename='customers')

address_router = DefaultRouter()
address_router.register('addresses', CustomerAddressViewSet, basename='addresses')

wishlist_router = DefaultRouter()
wishlist_router.register('wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('me/', CurrentCustomerView.as_view(), name='current-customer'),
    path('', include(router.urls)),
    path('', include(address_router.urls)),
    path('', include(wishlist_router.urls)),
]

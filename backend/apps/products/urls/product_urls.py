"""
Product URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products.views import ProductViewSet, ReviewViewSet, ProductVariantViewSet

router = DefaultRouter()
router.register('reviews', ReviewViewSet, basename='reviews')
router.register('variants', ProductVariantViewSet, basename='variants')

product_router = DefaultRouter()
product_router.register('', ProductViewSet, basename='products')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(product_router.urls)),
]

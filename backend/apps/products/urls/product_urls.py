"""
Product URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products.views import ProductViewSet, ReviewViewSet

router = DefaultRouter()
router.register('', ProductViewSet, basename='products')

review_router = DefaultRouter()
review_router.register('reviews', ReviewViewSet, basename='reviews')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(review_router.urls)),
]

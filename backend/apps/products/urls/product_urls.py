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

brand_router = DefaultRouter()
brand_router.register('brands', BrandViewSet, basename='brands')

attribute_router = DefaultRouter()
attribute_router.register('attributes', CategoryAttributeViewSet, basename='category-attributes')

product_attribute_router = DefaultRouter()
product_attribute_router.register('attribute-values', ProductAttributeValueViewSet, basename='product-attribute-values')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(product_router.urls)),
]

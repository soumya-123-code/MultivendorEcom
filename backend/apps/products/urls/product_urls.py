"""
Product URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products.views import ProductViewSet, ReviewViewSet
from apps.products.views.brand_views import BrandViewSet
from apps.products.views.attribute_views import CategoryAttributeViewSet, ProductAttributeValueViewSet

router = DefaultRouter()
router.register('', ProductViewSet, basename='products')

review_router = DefaultRouter()
review_router.register('reviews', ReviewViewSet, basename='reviews')

brand_router = DefaultRouter()
brand_router.register('brands', BrandViewSet, basename='brands')

attribute_router = DefaultRouter()
attribute_router.register('attributes', CategoryAttributeViewSet, basename='category-attributes')

product_attribute_router = DefaultRouter()
product_attribute_router.register('attribute-values', ProductAttributeValueViewSet, basename='product-attribute-values')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(review_router.urls)),
    path('', include(brand_router.urls)),
    path('', include(attribute_router.urls)),
    path('', include(product_attribute_router.urls)),
]

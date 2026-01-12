"""
Sales Order URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.sales_orders.views import SalesOrderViewSet

router = DefaultRouter()
router.register('', SalesOrderViewSet, basename='sales-orders')

urlpatterns = [
    path('', include(router.urls)),
]

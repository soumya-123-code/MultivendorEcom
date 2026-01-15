"""
Sales Order URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.sales_orders.views import SalesOrderViewSet
from apps.sales_orders.views.vendor_order_views import VendorOrderViewSet
from apps.sales_orders.views.return_views import ReturnRequestViewSet
from apps.sales_orders.views.coupon_views import CouponViewSet, CouponUsageViewSet

router = DefaultRouter()
router.register('', SalesOrderViewSet, basename='sales-orders')

vendor_order_router = DefaultRouter()
vendor_order_router.register('vendor-orders', VendorOrderViewSet, basename='vendor-orders')

return_router = DefaultRouter()
return_router.register('returns', ReturnRequestViewSet, basename='returns')

coupon_router = DefaultRouter()
coupon_router.register('coupons', CouponViewSet, basename='coupons')

coupon_usage_router = DefaultRouter()
coupon_usage_router.register('coupon-usage', CouponUsageViewSet, basename='coupon-usage')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(vendor_order_router.urls)),
    path('', include(return_router.urls)),
    path('', include(coupon_router.urls)),
    path('', include(coupon_usage_router.urls)),
]

"""
URL configuration for ERP E-Commerce project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)

# API v1 URLs
api_v1_patterns = [
    path('auth/', include('apps.accounts.urls.auth_urls')),
    path('users/', include('apps.accounts.urls.user_urls')),
    path('vendors/', include('apps.vendors.urls')),
    path('customers/', include('apps.customers.urls')),
    path('delivery-agents/', include('apps.delivery_agents.urls')),
    path('products/', include('apps.products.urls.product_urls')),
    path('categories/', include('apps.products.urls.category_urls')),
    path('inventory/', include('apps.inventory.urls')),
    path('warehouses/', include('apps.warehouses.urls')),
    path('purchase-orders/', include('apps.purchase_orders.urls')),
    path('sales-orders/', include('apps.sales_orders.urls')),
    path('cart/', include('apps.customers.urls_cart')),
    path('payments/', include('apps.payments.urls')),
    path('notifications/', include('apps.notifications.urls')),
    path('deliveries/', include('apps.delivery_agents.urls_delivery')),
]

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include(api_v1_patterns)),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

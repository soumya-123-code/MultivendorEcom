"""
URLs for settings app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'store', views.StoreSettingsViewSet, basename='store-settings')
router.register(r'currencies', views.CurrencySettingsViewSet, basename='currencies')
router.register(r'locations', views.StoreLocationViewSet, basename='store-locations')
router.register(r'shipping', views.ShippingMethodViewSet, basename='shipping')
router.register(r'tax', views.TaxSettingsViewSet, basename='tax')
router.register(r'checkout', views.CheckoutSettingsViewSet, basename='checkout')
router.register(r'invoice', views.InvoiceSettingsViewSet, basename='invoice')
router.register(r'return-policies', views.ReturnPolicyViewSet, basename='return-policies')
router.register(r'comparisons', views.ProductComparisonViewSet, basename='comparisons')

urlpatterns = router.urls

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.accounts.views.token import OutstandingTokenViewSet, BlacklistedTokenViewSet

router = DefaultRouter()
router.register(r'outstanding', OutstandingTokenViewSet, basename='outstanding-token')
router.register(r'blacklisted', BlacklistedTokenViewSet, basename='blacklisted-token')

urlpatterns = [
    path('', include(router.urls)),
]

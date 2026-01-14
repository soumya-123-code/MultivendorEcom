"""
User management URL patterns.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.accounts.views import CurrentUserView, UserViewSet
from apps.accounts.views.user import CurrentUserProfileView

router = DefaultRouter()
router.register('', UserViewSet, basename='users')

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('me/profile/', CurrentUserProfileView.as_view(), name='current-user-profile'),
    path('', include(router.urls)),
]

"""
User management views.
"""
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.accounts.models import User
from apps.accounts.serializers import (
    UserSerializer,
    UserListSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangeRoleSerializer,
    UserProfileSerializer,
)
from apps.accounts.services import UserService
from core.permissions import IsAdmin, IsSuperAdmin


class CurrentUserView(APIView):
    """
    View for current authenticated user.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: UserSerializer},
        tags=['Users']
    )
    def get(self, request):
        """Get current user's profile."""
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @extend_schema(
        request=UserUpdateSerializer,
        responses={200: UserSerializer},
        tags=['Users']
    )
    def patch(self, request):
        """Update current user's profile."""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        
        user = UserService.update_user(request.user, **serializer.validated_data)
        
        return Response({
            'success': True,
            'data': UserSerializer(user).data
        })


class CurrentUserProfileView(APIView):
    """
    View for current user's extended profile.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: UserProfileSerializer},
        tags=['Users']
    )
    def get(self, request):
        """Get current user's extended profile."""
        profile = getattr(request.user, 'profile', None)
        if not profile:
            from apps.accounts.models import UserProfile
            profile = UserProfile.objects.create(user=request.user)
        
        serializer = UserProfileSerializer(profile)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @extend_schema(
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
        tags=['Users']
    )
    def patch(self, request):
        """Update current user's extended profile."""
        serializer = UserProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        profile = UserService.update_profile(
            request.user,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'data': UserProfileSerializer(profile).data
        })


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management (Admin only).
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['date_joined', 'email', 'role']
    ordering = ['-date_joined']
    filterset_fields = ['role', 'is_active', 'is_verified']
    
    def get_queryset(self):
        return UserService.get_users_queryset(self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    @extend_schema(
        request=UserCreateSerializer,
        responses={201: UserSerializer},
        tags=['Users (Admin)']
    )
    def create(self, request, *args, **kwargs):
        """Create a new user (Admin only)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = UserService.create_user(**serializer.validated_data)
        
        return Response({
            'success': True,
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        request=ChangeRoleSerializer,
        responses={200: UserSerializer},
        tags=['Users (Admin)']
    )
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def change_role(self, request, pk=None):
        """Change user's role (Super Admin only)."""
        user = self.get_object()
        serializer = ChangeRoleSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        updated_user = UserService.change_role(
            user=user,
            new_role=serializer.validated_data['role'],
            changed_by=request.user
        )
        
        return Response({
            'success': True,
            'data': UserSerializer(updated_user).data
        })
    
    @extend_schema(
        responses={200: UserSerializer},
        tags=['Users (Admin)']
    )
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account."""
        user = self.get_object()
        updated_user = UserService.deactivate_user(user, request.user)
        
        return Response({
            'success': True,
            'data': UserSerializer(updated_user).data
        })
    
    @extend_schema(
        responses={200: UserSerializer},
        tags=['Users (Admin)']
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account."""
        user = self.get_object()
        updated_user = UserService.activate_user(user, request.user)
        
        return Response({
            'success': True,
            'data': UserSerializer(updated_user).data
        })

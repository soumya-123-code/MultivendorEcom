"""
Brand views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.products.models import Brand
from apps.products.serializers import (
    BrandSerializer,
    BrandListSerializer,
    BrandCreateSerializer,
)
from core.permissions import IsAdmin


class BrandViewSet(viewsets.ModelViewSet):
    """ViewSet for brand management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'product_count']
    ordering = ['name']
    filterset_fields = ['is_active', 'is_featured', 'is_verified']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def get_queryset(self):
        queryset = Brand.objects.all()

        # Public views show only active brands
        if self.action in ['list', 'retrieve']:
            if not self.request.user.is_authenticated or not self.request.user.is_admin:
                return queryset.filter(is_active=True)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return BrandListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return BrandCreateSerializer
        return BrandSerializer

    @extend_schema(tags=['Brands'])
    def list(self, request, *args, **kwargs):
        """List all brands."""
        return super().list(request, *args, **kwargs)

    @extend_schema(tags=['Brands'])
    def retrieve(self, request, *args, **kwargs):
        """Get brand details."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(tags=['Brands'])
    def create(self, request, *args, **kwargs):
        """Create a new brand."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        brand = serializer.save()

        return Response({
            'success': True,
            'data': BrandSerializer(brand).data
        }, status=status.HTTP_201_CREATED)

    @extend_schema(tags=['Brands'])
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a brand (Admin only)."""
        brand = self.get_object()
        brand.is_verified = True
        brand.save(update_fields=['is_verified', 'updated_at'])

        return Response({
            'success': True,
            'data': BrandSerializer(brand).data
        })

    @extend_schema(tags=['Brands'])
    @action(detail=True, methods=['post'])
    def feature(self, request, pk=None):
        """Feature a brand (Admin only)."""
        brand = self.get_object()
        brand.is_featured = not brand.is_featured
        brand.save(update_fields=['is_featured', 'updated_at'])

        return Response({
            'success': True,
            'data': BrandSerializer(brand).data
        })

    @extend_schema(tags=['Brands'])
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products for a brand."""
        from apps.products.serializers import ProductListSerializer
        brand = self.get_object()
        products = brand.products.filter(status='active')[:20]

        return Response({
            'success': True,
            'data': ProductListSerializer(products, many=True).data
        })

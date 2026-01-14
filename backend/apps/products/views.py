"""
Product views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.products.models import Product, Category, ProductReview
from apps.products.serializers import (
    ProductSerializer,
    ProductListSerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
    CategorySerializer,
    CategoryListSerializer,
    CategoryTreeSerializer,
    CategoryCreateSerializer,
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewListSerializer,
)
from apps.products.services import ProductService, CategoryService
from core.permissions import IsVendorOrAdmin, IsVendor


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for product management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['created_at', 'name', 'selling_price', 'rating']
    ordering = ['-created_at']
    filterset_fields = ['category', 'status', 'is_featured']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        
        # Public views show only active products
        if self.action in ['list', 'retrieve']:
            if not user.is_authenticated:
                return ProductService.get_public_products()
            if not user.is_admin and not hasattr(user, 'vendor'):
                return ProductService.get_public_products()
        
        # Vendors see their own products
        if user.is_authenticated and hasattr(user, 'vendor'):
            return ProductService.get_products_for_vendor(
                user.vendor, 
                include_inactive=True
            )
        
        # Admins see all
        if user.is_authenticated and user.is_admin:
            return Product.objects.all().select_related('vendor', 'category')
        
        return Product.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action == 'create':
            return ProductCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductSerializer
    
    @extend_schema(tags=['Products'])
    def create(self, request, *args, **kwargs):
        """Create a new product."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor = getattr(request.user, 'vendor', None)
        if not vendor:
            return Response({
                'success': False,
                'error': {'message': 'Vendor profile required.'}
            }, status=status.HTTP_403_FORBIDDEN)
        
        product = ProductService.create_product(
            vendor=vendor,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'data': ProductSerializer(product).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Products'])
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a product."""
        product = self.get_object()
        updated_product = ProductService.publish_product(product)
        
        return Response({
            'success': True,
            'data': ProductSerializer(updated_product).data
        })
    
    @extend_schema(tags=['Products'])
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a product."""
        product = self.get_object()
        updated_product = ProductService.unpublish_product(product)
        
        return Response({
            'success': True,
            'data': ProductSerializer(updated_product).data
        })
    
    @extend_schema(tags=['Products'])
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get product reviews."""
        product = self.get_object()
        reviews = product.reviews.filter(is_approved=True).order_by('-created_at')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = ReviewListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ReviewListSerializer(reviews, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for category management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['display_order', 'name']
    ordering = ['display_order']
    filterset_fields = ['parent', 'is_featured', 'level']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'tree']:
            return [AllowAny()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        return Category.objects.filter(is_active=True).select_related('parent')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryListSerializer
        if self.action == 'tree':
            return CategoryTreeSerializer
        if self.action == 'create':
            return CategoryCreateSerializer
        return CategorySerializer
    
    @extend_schema(tags=['Categories'])
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get category tree."""
        root_categories = Category.objects.filter(
            parent__isnull=True,
            is_active=True
        ).order_by('display_order')
        
        serializer = CategoryTreeSerializer(root_categories, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for product reviews."""
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at', 'rating', 'helpful_count']
    ordering = ['-created_at']
    filterset_fields = ['product', 'rating', 'is_approved']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = ProductReview.objects.select_related('product', 'customer')
        
        # Public views show only approved reviews
        if self.action in ['list', 'retrieve']:
            return queryset.filter(is_approved=True)
        
        # Users see their own reviews
        if self.request.user.is_authenticated:
            if hasattr(self.request.user, 'customer'):
                return queryset.filter(customer=self.request.user.customer)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ReviewListSerializer
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    @extend_schema(tags=['Reviews'])
    def create(self, request, *args, **kwargs):
        """Create a new review."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        customer = getattr(request.user, 'customer', None)
        if not customer:
            return Response({
                'success': False,
                'error': {'message': 'Customer profile required.'}
            }, status=status.HTTP_403_FORBIDDEN)
        
        review = serializer.save(customer=customer)
        
        return Response({
            'success': True,
            'data': ReviewSerializer(review).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Reviews'])
    @action(detail=True, methods=['post'])
    def helpful(self, request, pk=None):
        """Mark review as helpful."""
        review = self.get_object()
        review.mark_helpful()
        
        return Response({
            'success': True,
            'data': {'helpful_count': review.helpful_count}
        })

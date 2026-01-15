"""
Category Attribute views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.products.models import CategoryAttribute, ProductAttributeValue
from apps.products.serializers import (
    CategoryAttributeSerializer,
    CategoryAttributeListSerializer,
    CategoryAttributeCreateSerializer,
    ProductAttributeValueSerializer,
    ProductAttributeValueCreateSerializer,
)
from core.permissions import IsAdmin, IsVendorOrAdmin


class CategoryAttributeViewSet(viewsets.ModelViewSet):
    """ViewSet for category attribute management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['position', 'name', 'created_at']
    ordering = ['position', 'name']
    filterset_fields = ['category', 'attribute_type', 'is_filterable', 'is_variant_attribute']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def get_queryset(self):
        return CategoryAttribute.objects.select_related('category')

    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryAttributeListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryAttributeCreateSerializer
        return CategoryAttributeSerializer

    @extend_schema(tags=['Category Attributes'])
    def list(self, request, *args, **kwargs):
        """List category attributes."""
        return super().list(request, *args, **kwargs)

    @extend_schema(tags=['Category Attributes'])
    def retrieve(self, request, *args, **kwargs):
        """Get attribute details."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(tags=['Category Attributes'])
    def create(self, request, *args, **kwargs):
        """Create a new category attribute."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attribute = serializer.save()

        return Response({
            'success': True,
            'data': CategoryAttributeSerializer(attribute).data
        }, status=status.HTTP_201_CREATED)

    @extend_schema(tags=['Category Attributes'])
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get attributes for a specific category."""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response({
                'success': False,
                'error': {'message': 'category_id is required'}
            }, status=status.HTTP_400_BAD_REQUEST)

        attributes = self.get_queryset().filter(category_id=category_id)
        serializer = CategoryAttributeSerializer(attributes, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    @extend_schema(tags=['Category Attributes'])
    @action(detail=False, methods=['get'])
    def filters(self, request):
        """Get filterable attributes for a category."""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response({
                'success': False,
                'error': {'message': 'category_id is required'}
            }, status=status.HTTP_400_BAD_REQUEST)

        attributes = self.get_queryset().filter(
            category_id=category_id,
            is_filterable=True
        )
        serializer = CategoryAttributeSerializer(attributes, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })


class ProductAttributeValueViewSet(viewsets.ModelViewSet):
    """ViewSet for product attribute values."""
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['attribute__position']
    filterset_fields = ['product', 'attribute']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsVendorOrAdmin()]

    def get_queryset(self):
        return ProductAttributeValue.objects.select_related('product', 'attribute')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductAttributeValueCreateSerializer
        return ProductAttributeValueSerializer

    @extend_schema(tags=['Product Attributes'])
    def list(self, request, *args, **kwargs):
        """List product attribute values."""
        return super().list(request, *args, **kwargs)

    @extend_schema(tags=['Product Attributes'])
    def create(self, request, *args, **kwargs):
        """Create product attribute value."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check vendor ownership
        user = request.user
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            product_id = request.data.get('product')
            from apps.products.models import Product
            try:
                product = Product.objects.get(id=product_id)
                if product.vendor != user.vendor:
                    return Response({
                        'success': False,
                        'error': {'message': 'Not authorized for this product'}
                    }, status=status.HTTP_403_FORBIDDEN)
            except Product.DoesNotExist:
                return Response({
                    'success': False,
                    'error': {'message': 'Product not found'}
                }, status=status.HTTP_404_NOT_FOUND)

        value = serializer.save()

        return Response({
            'success': True,
            'data': ProductAttributeValueSerializer(value).data
        }, status=status.HTTP_201_CREATED)

    @extend_schema(tags=['Product Attributes'])
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create attribute values for a product."""
        product_id = request.data.get('product_id')
        values = request.data.get('values', [])

        if not product_id or not values:
            return Response({
                'success': False,
                'error': {'message': 'product_id and values are required'}
            }, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for val in values:
            val['product'] = product_id
            serializer = ProductAttributeValueCreateSerializer(data=val)
            if serializer.is_valid():
                obj = serializer.save()
                created.append(ProductAttributeValueSerializer(obj).data)

        return Response({
            'success': True,
            'data': created
        }, status=status.HTTP_201_CREATED)

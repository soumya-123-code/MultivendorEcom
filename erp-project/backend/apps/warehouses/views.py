"""
Warehouse views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.warehouses.models import Warehouse, RackShelfLocation
from apps.warehouses.serializers import (
    WarehouseSerializer,
    WarehouseListSerializer,
    WarehouseCreateSerializer,
    WarehouseUpdateSerializer,
    RackShelfLocationSerializer,
    RackShelfLocationCreateSerializer,
)
from core.permissions import IsAdmin, IsVendorOrAdmin, IsVendorOwner


class WarehouseViewSet(viewsets.ModelViewSet):
    """ViewSet for warehouse management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'code', 'city', 'state']
    ordering_fields = ['name', 'created_at', 'city']
    ordering = ['name']
    filterset_fields = ['status', 'city', 'state', 'warehouse_type', 'vendor']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsVendorOrAdmin()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Warehouse.objects.select_related('vendor', 'manager').prefetch_related('locations')
        
        # Admins see all warehouses
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see only their warehouses
        if hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)
        
        # Warehouse managers see their assigned warehouses
        return queryset.filter(manager=user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseListSerializer
        if self.action == 'create':
            return WarehouseCreateSerializer
        if self.action in ['update', 'partial_update']:
            return WarehouseUpdateSerializer
        return WarehouseSerializer
    
    @extend_schema(tags=['Warehouses'])
    def list(self, request, *args, **kwargs):
        """List warehouses."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Warehouses'])
    def retrieve(self, request, *args, **kwargs):
        """Get warehouse details."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(tags=['Warehouses'])
    def create(self, request, *args, **kwargs):
        """Create a new warehouse."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get vendor
        vendor = None
        if request.user.role == 'vendor' and hasattr(request.user, 'vendor'):
            vendor = request.user.vendor
        elif request.user.role in ['super_admin', 'admin']:
            vendor_id = request.data.get('vendor')
            if vendor_id:
                from apps.vendors.models import Vendor
                vendor = Vendor.objects.filter(id=vendor_id).first()
        
        if not vendor:
            return Response({
                'success': False,
                'error': {'message': 'Vendor is required.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        warehouse = Warehouse.objects.create(
            vendor=vendor,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'data': WarehouseSerializer(warehouse).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Warehouses'])
    def update(self, request, *args, **kwargs):
        """Update warehouse."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        for attr, value in serializer.validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return Response({
            'success': True,
            'data': WarehouseSerializer(instance).data
        })
    
    @extend_schema(tags=['Warehouses'])
    def destroy(self, request, *args, **kwargs):
        """Delete warehouse."""
        instance = self.get_object()
        
        # Check for inventory
        if instance.inventory_items.exists():
            return Response({
                'success': False,
                'error': {'message': 'Cannot delete warehouse with inventory items.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        instance.delete()
        return Response({
            'success': True,
            'message': 'Warehouse deleted successfully.'
        }, status=status.HTTP_204_NO_CONTENT)
    
    @extend_schema(tags=['Warehouses'])
    @action(detail=True, methods=['get', 'post'])
    def locations(self, request, pk=None):
        """Get or create locations for a warehouse."""
        warehouse = self.get_object()
        
        if request.method == 'GET':
            locations = warehouse.locations.all()
            return Response({
                'success': True,
                'data': RackShelfLocationSerializer(locations, many=True).data
            })
        
        # POST - create new location
        serializer = RackShelfLocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        location = RackShelfLocation.objects.create(
            warehouse=warehouse,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'data': RackShelfLocationSerializer(location).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Warehouses'])
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get warehouse statistics."""
        warehouse = self.get_object()
        
        inventory_items = warehouse.inventory_items.all()
        total_items = inventory_items.count()
        total_quantity = sum(item.quantity for item in inventory_items)
        low_stock = inventory_items.filter(stock_status='low_stock').count()
        out_of_stock = inventory_items.filter(stock_status='out_of_stock').count()
        
        return Response({
            'success': True,
            'data': {
                'total_items': total_items,
                'total_quantity': total_quantity,
                'low_stock_items': low_stock,
                'out_of_stock_items': out_of_stock,
                'total_capacity': warehouse.total_capacity,
                'used_capacity': warehouse.used_capacity,
                'location_count': warehouse.locations.count(),
            }
        })


class RackShelfLocationViewSet(viewsets.ModelViewSet):
    """ViewSet for rack/shelf location management."""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'code']
    filterset_fields = ['warehouse']
    
    def get_queryset(self):
        user = self.request.user
        queryset = RackShelfLocation.objects.select_related('warehouse')
        
        # Filter by warehouse if provided
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)
        
        # Admins see all
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see only their warehouse locations
        if hasattr(user, 'vendor'):
            return queryset.filter(warehouse__vendor=user.vendor)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RackShelfLocationCreateSerializer
        return RackShelfLocationSerializer
    
    @extend_schema(tags=['Warehouse Locations'])
    def create(self, request, *args, **kwargs):
        """Create a new location."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        warehouse_id = request.data.get('warehouse')
        if not warehouse_id:
            return Response({
                'success': False,
                'error': {'message': 'Warehouse is required.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        warehouse = Warehouse.objects.filter(id=warehouse_id).first()
        if not warehouse:
            return Response({
                'success': False,
                'error': {'message': 'Warehouse not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        location = RackShelfLocation.objects.create(
            warehouse=warehouse,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'data': RackShelfLocationSerializer(location).data
        }, status=status.HTTP_201_CREATED)

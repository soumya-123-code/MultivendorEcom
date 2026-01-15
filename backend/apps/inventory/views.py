"""
Inventory views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.db.models import Sum, F

from apps.inventory.models import Inventory, InventoryLog
from apps.inventory.serializers import (
    InventorySerializer,
    InventoryListSerializer,
    InventoryCreateSerializer,
    InventoryUpdateSerializer,
    InventoryAdjustSerializer,
    InventoryTransferSerializer,
    InventoryReserveSerializer,
    InventoryLogSerializer,
)
from apps.warehouses.models import Warehouse, RackShelfLocation
from core.permissions import IsVendorOrAdmin
from core.utils.constants import StockStatus, MovementType


class InventoryViewSet(viewsets.ModelViewSet):
    """ViewSet for inventory management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['product__name', 'product__sku', 'batch_number', 'serial_number']
    ordering_fields = ['quantity', 'created_at', 'updated_at', 'expiry_date']
    ordering = ['-updated_at']
    filterset_fields = ['warehouse', 'product', 'vendor', 'stock_status', 'inward_type']
    
    def get_permissions(self):
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Inventory.objects.select_related(
            'product', 'variant', 'warehouse', 'location', 'vendor'
        )
        
        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status')
        if stock_status:
            queryset = queryset.filter(stock_status=stock_status)
        
        # Admins see all inventory
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see only their inventory
        if hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)
        
        # Warehouse users see inventory in their warehouses
        if user.role == 'warehouse':
            return queryset.filter(warehouse__manager=user)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InventoryListSerializer
        if self.action == 'create':
            return InventoryCreateSerializer
        if self.action in ['update', 'partial_update']:
            return InventoryUpdateSerializer
        if self.action == 'adjust':
            return InventoryAdjustSerializer
        if self.action == 'transfer':
            return InventoryTransferSerializer
        if self.action == 'reserve':
            return InventoryReserveSerializer
        return InventorySerializer
    
    @extend_schema(tags=['Inventory'])
    def list(self, request, *args, **kwargs):
        """List inventory items."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Inventory'])
    def retrieve(self, request, *args, **kwargs):
        """Get inventory details."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(tags=['Inventory'])
    def create(self, request, *args, **kwargs):
        """Create a new inventory entry."""
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
        
        inventory = Inventory.objects.create(
            vendor=vendor,
            **serializer.validated_data
        )
        inventory.update_stock_status()
        
        # Log creation
        InventoryLog.objects.create(
            inventory=inventory,
            product=inventory.product,
            warehouse=inventory.warehouse,
            vendor=vendor,
            movement_type=MovementType.INWARD,
            quantity=inventory.quantity,
            quantity_before=0,
            quantity_after=inventory.quantity,
            reference_type='initial',
            notes='Initial inventory creation',
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'data': InventorySerializer(inventory).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Inventory'])
    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """Adjust inventory quantity (add/subtract)."""
        inventory = self.get_object()
        serializer = InventoryAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quantity = serializer.validated_data['quantity']
        reason = serializer.validated_data.get('reason', '')
        
        old_qty = inventory.quantity
        new_qty = old_qty + quantity
        
        if new_qty < 0:
            return Response({
                'success': False,
                'error': {'message': 'Adjustment would result in negative inventory.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        inventory.quantity = new_qty
        inventory.save(update_fields=['quantity', 'updated_at'])
        inventory.update_stock_status()
        
        # Log adjustment
        InventoryLog.objects.create(
            inventory=inventory,
            product=inventory.product,
            warehouse=inventory.warehouse,
            vendor=inventory.vendor,
            movement_type=MovementType.ADJUSTMENT,
            quantity=quantity,
            quantity_before=old_qty,
            quantity_after=new_qty,
            notes=reason,
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'data': InventorySerializer(inventory).data
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """Transfer inventory between warehouses."""
        inventory = self.get_object()
        serializer = InventoryTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        to_warehouse_id = serializer.validated_data['to_warehouse']
        to_location_id = serializer.validated_data.get('to_location')
        quantity = serializer.validated_data['quantity']
        reason = serializer.validated_data.get('reason', '')
        
        # Validate
        if quantity > inventory.available_quantity:
            return Response({
                'success': False,
                'error': {'message': 'Insufficient available quantity for transfer.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        to_warehouse = Warehouse.objects.filter(id=to_warehouse_id).first()
        if not to_warehouse:
            return Response({
                'success': False,
                'error': {'message': 'Destination warehouse not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        to_location = None
        if to_location_id:
            to_location = RackShelfLocation.objects.filter(
                id=to_location_id, warehouse=to_warehouse
            ).first()
        
        # Subtract from source
        old_qty = inventory.quantity
        inventory.quantity -= quantity
        inventory.save(update_fields=['quantity', 'updated_at'])
        inventory.update_stock_status()
        
        # Log outward
        InventoryLog.objects.create(
            inventory=inventory,
            product=inventory.product,
            warehouse=inventory.warehouse,
            vendor=inventory.vendor,
            movement_type=MovementType.TRANSFER,
            quantity=-quantity,
            quantity_before=old_qty,
            quantity_after=inventory.quantity,
            notes=f"Transfer to {to_warehouse.code}: {reason}",
            created_by=request.user
        )
        
        # Find or create destination inventory
        dest_inventory, created = Inventory.objects.get_or_create(
            product=inventory.product,
            variant=inventory.variant,
            warehouse=to_warehouse,
            vendor=inventory.vendor,
            batch_number=inventory.batch_number,
            defaults={
                'location': to_location,
                'quantity': 0,
                'buy_price': inventory.buy_price,
                'sell_price': inventory.sell_price,
                'mrp': inventory.mrp,
                'inward_type': 'transfer',
            }
        )
        
        dest_old_qty = dest_inventory.quantity
        dest_inventory.quantity += quantity
        dest_inventory.save(update_fields=['quantity', 'updated_at'])
        dest_inventory.update_stock_status()
        
        # Log inward
        InventoryLog.objects.create(
            inventory=dest_inventory,
            product=inventory.product,
            warehouse=to_warehouse,
            vendor=inventory.vendor,
            movement_type=MovementType.TRANSFER,
            quantity=quantity,
            quantity_before=dest_old_qty,
            quantity_after=dest_inventory.quantity,
            notes=f"Transfer from {inventory.warehouse.code}: {reason}",
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'data': {
                'source': InventorySerializer(inventory).data,
                'destination': InventorySerializer(dest_inventory).data
            }
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        """Reserve inventory for an order."""
        inventory = self.get_object()
        serializer = InventoryReserveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quantity = serializer.validated_data['quantity']
        
        if quantity > inventory.available_quantity:
            return Response({
                'success': False,
                'error': {'message': 'Insufficient available quantity.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        inventory.reserve(quantity)
        
        # Log reservation
        InventoryLog.objects.create(
            inventory=inventory,
            product=inventory.product,
            warehouse=inventory.warehouse,
            vendor=inventory.vendor,
            movement_type=MovementType.RESERVED,
            quantity=quantity,
            notes=serializer.validated_data.get('reason', 'Order reservation'),
            reference_type='sales_order',
            reference_id=serializer.validated_data.get('order_id'),
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'data': InventorySerializer(inventory).data
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=True, methods=['post'])
    def unreserve(self, request, pk=None):
        """Release reserved inventory."""
        inventory = self.get_object()
        serializer = InventoryReserveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quantity = serializer.validated_data['quantity']
        
        if quantity > inventory.reserved_quantity:
            return Response({
                'success': False,
                'error': {'message': 'Cannot unreserve more than reserved quantity.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        inventory.unreserve(quantity)
        
        # Log
        InventoryLog.objects.create(
            inventory=inventory,
            product=inventory.product,
            warehouse=inventory.warehouse,
            vendor=inventory.vendor,
            movement_type=MovementType.UNRESERVED,
            quantity=-quantity,
            notes=serializer.validated_data.get('reason', 'Reservation released'),
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'data': InventorySerializer(inventory).data
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Get inventory movement logs."""
        inventory = self.get_object()
        logs = inventory.logs.all()[:50]
        return Response({
            'success': True,
            'data': InventoryLogSerializer(logs, many=True).data
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get low stock inventory items."""
        queryset = self.get_queryset().filter(stock_status=StockStatus.LOW_STOCK)
        serializer = InventoryListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get out of stock inventory items."""
        queryset = self.get_queryset().filter(stock_status=StockStatus.OUT_OF_STOCK)
        serializer = InventoryListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=False, methods=['get'], url_path='expiring-soon')
    def expiring_soon(self, request):
        """Get inventory items expiring soon (within 30 days)."""
        from django.utils import timezone
        from datetime import timedelta
        
        threshold = timezone.now().date() + timedelta(days=30)
        queryset = self.get_queryset().filter(
            expiry_date__isnull=False,
            expiry_date__lte=threshold
        ).order_by('expiry_date')
        
        serializer = InventoryListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @extend_schema(tags=['Inventory'])
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get inventory summary statistics."""
        queryset = self.get_queryset()
        
        total_items = queryset.count()
        total_quantity = queryset.aggregate(total=Sum('quantity'))['total'] or 0
        total_value = queryset.aggregate(
            value=Sum(F('quantity') * F('buy_price'))
        )['value'] or 0
        
        by_status = {
            'in_stock': queryset.filter(stock_status=StockStatus.IN_STOCK).count(),
            'low_stock': queryset.filter(stock_status=StockStatus.LOW_STOCK).count(),
            'out_of_stock': queryset.filter(stock_status=StockStatus.OUT_OF_STOCK).count(),
        }
        
        return Response({
            'success': True,
            'data': {
                'total_items': total_items,
                'total_quantity': total_quantity,
                'total_value': float(total_value),
                'by_status': by_status,
            }
        })


class InventoryLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing inventory logs."""
    serializer_class = InventoryLogSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['product__name', 'product__sku', 'warehouse__name', 'notes']
    ordering_fields = ['created_at', 'quantity', 'movement_type']
    ordering = ['-created_at']
    filterset_fields = ['warehouse', 'product', 'vendor', 'movement_type']
    
    def get_permissions(self):
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = InventoryLog.objects.select_related(
            'inventory', 'product', 'warehouse', 'vendor', 'created_by'
        )
        
        # Admins see all logs
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see only their logs
        if hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)
        
        # Warehouse users see logs for their warehouse
        if user.role == 'warehouse':
            return queryset.filter(warehouse__manager=user)
        
        return queryset.none()

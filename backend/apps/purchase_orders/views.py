"""
Purchase Order views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.db import transaction
import uuid

from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, POStatusLog
from apps.purchase_orders.serializers import (
    PurchaseOrderSerializer,
    PurchaseOrderListSerializer,
    PurchaseOrderCreateSerializer,
    PurchaseOrderUpdateSerializer,
    POStatusUpdateSerializer,
    PORejectSerializer,
    POCancelSerializer,
    POReceiveSerializer,
    POStatusLogSerializer,
)
from apps.vendors.models import Supplier
from apps.warehouses.models import Warehouse, RackShelfLocation
from apps.products.models import Product
from apps.inventory.models import Inventory, InventoryLog
from core.permissions import IsVendorOrAdmin
from core.utils.constants import POStatus, MovementType


def generate_po_number():
    """Generate unique PO number."""
    return f"PO-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def log_status_change(po, old_status, new_status, user, notes=None):
    """Create status log entry."""
    POStatusLog.objects.create(
        purchase_order=po,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
        changed_by=user
    )


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for purchase order management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['po_number', 'supplier__name']
    ordering_fields = ['po_date', 'total_amount', 'created_at', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'payment_status', 'vendor', 'supplier', 'warehouse']
    
    def get_permissions(self):
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = PurchaseOrder.objects.select_related(
            'vendor', 'supplier', 'warehouse'
        ).prefetch_related('items', 'items__product', 'status_logs')
        
        # Admins see all POs
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see only their POs
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)
        
        # Warehouse users see POs for their warehouse
        if user.role == 'warehouse':
            return queryset.filter(warehouse__manager=user)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseOrderListSerializer
        if self.action == 'create':
            return PurchaseOrderCreateSerializer
        if self.action in ['update', 'partial_update']:
            return PurchaseOrderUpdateSerializer
        if self.action in ['submit', 'approve', 'send', 'confirm']:
            return POStatusUpdateSerializer
        if self.action == 'reject':
            return PORejectSerializer
        if self.action == 'cancel':
            return POCancelSerializer
        if self.action == 'receive':
            return POReceiveSerializer
        return PurchaseOrderSerializer
    
    @extend_schema(tags=['Purchase Orders'])
    def list(self, request, *args, **kwargs):
        """List purchase orders."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Purchase Orders'])
    def retrieve(self, request, *args, **kwargs):
        """Get purchase order details."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(tags=['Purchase Orders'])
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new purchase order."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
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
        
        # Get supplier
        supplier = Supplier.objects.filter(id=data['supplier']).first()
        if not supplier:
            return Response({
                'success': False,
                'error': {'message': 'Supplier not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get warehouse
        warehouse = Warehouse.objects.filter(id=data['warehouse']).first()
        if not warehouse:
            return Response({
                'success': False,
                'error': {'message': 'Warehouse not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate items
        items_data = data.get('items', [])
        if not items_data:
            return Response({
                'success': False,
                'error': {'message': 'At least one item is required.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create PO
        po = PurchaseOrder.objects.create(
            vendor=vendor,
            supplier=supplier,
            warehouse=warehouse,
            po_number=generate_po_number(),
            po_date=data['po_date'],
            expected_delivery_date=data.get('expected_delivery_date'),
            payment_terms=data.get('payment_terms', ''),
            discount_type=data.get('discount_type', 'none'),
            discount_value=data.get('discount_value', 0),
            shipping_amount=data.get('shipping_amount', 0),
            notes=data.get('notes', ''),
            terms_and_conditions=data.get('terms_and_conditions', ''),
            status=POStatus.DRAFT,
        )
        
        # Create items
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product'])
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product=product,
                variant_id=item_data.get('variant'),
                quantity_ordered=item_data['quantity_ordered'],
                unit_price=item_data['unit_price'],
                selling_price=item_data.get('selling_price'),
                discount_type=item_data.get('discount_type'),
                discount_value=item_data.get('discount_value', 0),
                tax_percentage=item_data.get('tax_percentage', 0),
                notes=item_data.get('notes', ''),
            )
        
        # Calculate totals
        po.calculate_totals()
        
        # Log creation
        log_status_change(po, None, POStatus.DRAFT, request.user, 'PO created')
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit PO for approval."""
        po = self.get_object()
        
        if po.status != POStatus.DRAFT:
            return Response({
                'success': False,
                'error': {'message': f'Cannot submit PO in {po.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = po.status
        po.status = POStatus.PENDING_APPROVAL
        po.save(update_fields=['status', 'updated_at'])
        
        log_status_change(po, old_status, POStatus.PENDING_APPROVAL, request.user,
                         request.data.get('notes', 'PO submitted for approval'))
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a PO."""
        po = self.get_object()
        
        if po.status != POStatus.PENDING_APPROVAL:
            return Response({
                'success': False,
                'error': {'message': f'Cannot approve PO in {po.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = po.status
        po.status = POStatus.APPROVED
        po.approved_by = request.user
        po.approved_at = timezone.now()
        po.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])
        
        log_status_change(po, old_status, POStatus.APPROVED, request.user,
                         request.data.get('notes', 'PO approved'))
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a PO."""
        po = self.get_object()
        serializer = PORejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if po.status != POStatus.PENDING_APPROVAL:
            return Response({
                'success': False,
                'error': {'message': f'Cannot reject PO in {po.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = po.status
        po.status = POStatus.REJECTED
        po.rejection_reason = serializer.validated_data['reason']
        po.save(update_fields=['status', 'rejection_reason', 'updated_at'])
        
        log_status_change(po, old_status, POStatus.REJECTED, request.user,
                         serializer.validated_data['reason'])
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Mark PO as sent to supplier."""
        po = self.get_object()
        
        if po.status != POStatus.APPROVED:
            return Response({
                'success': False,
                'error': {'message': f'Cannot send PO in {po.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = po.status
        po.status = POStatus.SENT
        po.save(update_fields=['status', 'updated_at'])
        
        log_status_change(po, old_status, POStatus.SENT, request.user,
                         request.data.get('notes', 'PO sent to supplier'))
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm PO receipt from supplier."""
        po = self.get_object()
        
        if po.status != POStatus.SENT:
            return Response({
                'success': False,
                'error': {'message': f'Cannot confirm PO in {po.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = po.status
        po.status = POStatus.CONFIRMED
        po.save(update_fields=['status', 'updated_at'])
        
        log_status_change(po, old_status, POStatus.CONFIRMED, request.user,
                         request.data.get('notes', 'PO confirmed by supplier'))
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a PO."""
        po = self.get_object()
        serializer = POCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if po.status not in POStatus.CANCELLABLE_STATES:
            return Response({
                'success': False,
                'error': {'message': f'Cannot cancel PO in {po.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = po.status
        po.status = POStatus.CANCELLED
        po.cancelled_by = request.user
        po.cancelled_at = timezone.now()
        po.cancellation_reason = serializer.validated_data['reason']
        po.save(update_fields=['status', 'cancelled_by', 'cancelled_at', 
                               'cancellation_reason', 'updated_at'])
        
        log_status_change(po, old_status, POStatus.CANCELLED, request.user,
                         serializer.validated_data['reason'])
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def receive(self, request, pk=None):
        """Receive items from a PO and create inventory."""
        po = self.get_object()
        serializer = POReceiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if po.status not in [POStatus.CONFIRMED, POStatus.RECEIVING, POStatus.PARTIAL_RECEIVED]:
            return Response({
                'success': False,
                'error': {'message': f'Cannot receive items for PO in {po.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        items_data = serializer.validated_data['items']
        received_items = []
        
        for item_data in items_data:
            po_item = po.items.filter(id=item_data['item_id']).first()
            if not po_item:
                continue
            
            qty_to_receive = item_data['quantity_received']
            max_receivable = po_item.quantity_pending
            
            if qty_to_receive > max_receivable:
                continue
            
            # Update PO item
            po_item.quantity_received += qty_to_receive
            po_item.save(update_fields=['quantity_received', 'updated_at'])
            
            # Get or create location
            location = None
            if item_data.get('location_id'):
                location = RackShelfLocation.objects.filter(
                    id=item_data['location_id'], warehouse=po.warehouse
                ).first()
            
            # Create or update inventory
            inventory, created = Inventory.objects.get_or_create(
                product=po_item.product,
                variant=po_item.variant,
                warehouse=po.warehouse,
                vendor=po.vendor,
                batch_number=item_data.get('batch_number', ''),
                defaults={
                    'location': location,
                    'quantity': 0,
                    'buy_price': po_item.unit_price,
                    'sell_price': po_item.selling_price,
                    'inward_type': 'purchase',
                    'purchase_order': po,
                    'purchase_order_item': po_item,
                    'expiry_date': item_data.get('expiry_date'),
                }
            )
            
            old_qty = inventory.quantity
            inventory.quantity += qty_to_receive
            inventory.save(update_fields=['quantity', 'updated_at'])
            inventory.update_stock_status()
            
            # Log inventory movement
            InventoryLog.objects.create(
                inventory=inventory,
                product=po_item.product,
                warehouse=po.warehouse,
                vendor=po.vendor,
                movement_type=MovementType.INWARD,
                quantity=qty_to_receive,
                quantity_before=old_qty,
                quantity_after=inventory.quantity,
                reference_type='purchase_order',
                reference_id=po.id,
                notes=f"Received from PO {po.po_number}",
                created_by=request.user
            )
            
            received_items.append({
                'item_id': po_item.id,
                'product': po_item.product.name,
                'quantity_received': qty_to_receive,
            })
        
        # Update PO status
        old_status = po.status
        all_received = all(item.quantity_pending == 0 for item in po.items.all())
        
        if all_received:
            po.status = POStatus.RECEIVED
            po.actual_delivery_date = timezone.now().date()
        else:
            po.status = POStatus.PARTIAL_RECEIVED
        
        po.save(update_fields=['status', 'actual_delivery_date', 'updated_at'])
        
        log_status_change(po, old_status, po.status, request.user,
                         serializer.validated_data.get('notes', 'Items received'))
        
        return Response({
            'success': True,
            'data': {
                'po': PurchaseOrderSerializer(po).data,
                'received_items': received_items
            }
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark PO as complete."""
        po = self.get_object()
        
        if po.status != POStatus.RECEIVED:
            return Response({
                'success': False,
                'error': {'message': 'PO must be fully received first.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = po.status
        po.status = POStatus.COMPLETE
        po.save(update_fields=['status', 'updated_at'])
        
        log_status_change(po, old_status, POStatus.COMPLETE, request.user, 'PO completed')
        
        return Response({
            'success': True,
            'data': PurchaseOrderSerializer(po).data
        })
    
    @extend_schema(tags=['Purchase Orders'])
    @action(detail=True, methods=['get'], url_path='status-logs')
    def status_logs(self, request, pk=None):
        """Get PO status change history."""
        po = self.get_object()
        logs = po.status_logs.all()
        return Response({
            'success': True,
            'data': POStatusLogSerializer(logs, many=True).data
        })

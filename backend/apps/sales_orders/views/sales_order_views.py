"""
Sales Order views.
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

from apps.sales_orders.models import SalesOrder, SalesOrderItem, SOStatusLog
from apps.sales_orders.serializers import (
    SalesOrderSerializer,
    SalesOrderListSerializer,
    SalesOrderCreateSerializer,
    SalesOrderUpdateSerializer,
    OrderStatusUpdateSerializer,
    OrderCancelSerializer,
    AssignDeliverySerializer,
    SOStatusLogSerializer,
)
from apps.customers.models import Customer, CustomerAddress
from apps.products.models import Product
from apps.delivery_agents.models import DeliveryAgent, DeliveryAssignment
from core.permissions import IsAdmin, IsVendorOrAdmin, IsCustomer
from core.utils.constants import SOStatus, PaymentStatus, DeliveryStatus


def generate_order_number():
    """Generate unique order number."""
    return f"SO-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def log_status_change(order, old_status, new_status, user, notes=None):
    """Create status log entry."""
    SOStatusLog.objects.create(
        sales_order=order,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
        changed_by=user
    )


class SalesOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for sales order management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['order_number', 'customer__user__email', 'customer__user__first_name']
    ordering_fields = ['order_date', 'total_amount', 'created_at', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'payment_status', 'vendor', 'customer']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = SalesOrder.objects.select_related(
            'vendor', 'customer', 'customer__user', 
            'shipping_address', 'billing_address'
        ).prefetch_related('items', 'items__product', 'status_logs')
        
        # Admins see all orders
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see only their orders
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)
        
        # Customers see only their orders
        if user.role == 'customer' and hasattr(user, 'customer'):
            return queryset.filter(customer=user.customer)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SalesOrderListSerializer
        if self.action == 'create':
            return SalesOrderCreateSerializer
        if self.action in ['update', 'partial_update']:
            return SalesOrderUpdateSerializer
        if self.action in ['confirm', 'process', 'pack', 'ready_for_pickup']:
            return OrderStatusUpdateSerializer
        if self.action == 'cancel':
            return OrderCancelSerializer
        if self.action == 'assign_delivery':
            return AssignDeliverySerializer
        return SalesOrderSerializer
    
    @extend_schema(tags=['Sales Orders'])
    def list(self, request, *args, **kwargs):
        """List sales orders."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Sales Orders'])
    def retrieve(self, request, *args, **kwargs):
        """Get sales order details."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(tags=['Sales Orders'])
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new sales order."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Get customer
        customer = Customer.objects.filter(id=data['customer']).first()
        if not customer:
            return Response({
                'success': False,
                'error': {'message': 'Customer not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get addresses
        shipping_address = CustomerAddress.objects.filter(id=data['shipping_address']).first()
        if not shipping_address:
            return Response({
                'success': False,
                'error': {'message': 'Shipping address not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        billing_address = None
        if data.get('billing_address'):
            billing_address = CustomerAddress.objects.filter(id=data['billing_address']).first()
        
        # Determine vendor from first item
        items_data = data.get('items', [])
        if not items_data:
            return Response({
                'success': False,
                'error': {'message': 'At least one item is required.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        first_product = Product.objects.filter(id=items_data[0]['product']).first()
        if not first_product or not first_product.vendor:
            return Response({
                'success': False,
                'error': {'message': 'Invalid product.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        vendor = first_product.vendor
        
        # Create order
        order = SalesOrder.objects.create(
            vendor=vendor,
            customer=customer,
            order_number=generate_order_number(),
            shipping_address=shipping_address,
            billing_address=billing_address or shipping_address,
            shipping_address_snapshot=self._address_snapshot(shipping_address),
            billing_address_snapshot=self._address_snapshot(billing_address or shipping_address),
            payment_method=data.get('payment_method', ''),
            shipping_method=data.get('shipping_method', ''),
            shipping_amount=data.get('shipping_amount', 0),
            discount_type=data.get('discount_type', ''),
            discount_value=data.get('discount_value', 0),
            coupon_code=data.get('coupon_code', ''),
            customer_notes=data.get('customer_notes', ''),
            status=SOStatus.PENDING,
        )
        
        # Create items
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product'])
            SalesOrderItem.objects.create(
                sales_order=order,
                product=product,
                variant_id=item_data.get('variant'),
                quantity_ordered=item_data['quantity_ordered'],
                unit_price=item_data.get('unit_price', product.selling_price or product.base_price),
                discount_type=item_data.get('discount_type'),
                discount_value=item_data.get('discount_value', 0),
                tax_percentage=item_data.get('tax_percentage', product.tax_percentage or 0),
                notes=item_data.get('notes', ''),
            )
        
        # Calculate totals
        order.calculate_totals()
        
        # Log creation
        log_status_change(order, None, SOStatus.PENDING, request.user, 'Order created')
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        }, status=status.HTTP_201_CREATED)
    
    def _address_snapshot(self, address):
        """Create address snapshot for order."""
        if not address:
            return None
        return {
            'full_name': address.full_name,
            'phone': address.phone,
            'address_line1': address.address_line1,
            'address_line2': address.address_line2,
            'city': address.city,
            'state': address.state,
            'country': address.country,
            'pincode': address.pincode,
            'landmark': address.landmark,
        }
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a pending order."""
        order = self.get_object()
        
        if order.status != SOStatus.PENDING:
            return Response({
                'success': False,
                'error': {'message': f'Cannot confirm order in {order.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = order.status
        order.status = SOStatus.CONFIRMED
        order.approved_by = request.user
        order.approved_at = timezone.now()
        order.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.CONFIRMED, request.user, 
                         request.data.get('notes', 'Order confirmed'))
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Start processing an order."""
        order = self.get_object()
        
        if order.status != SOStatus.CONFIRMED:
            return Response({
                'success': False,
                'error': {'message': f'Cannot process order in {order.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = order.status
        order.status = SOStatus.PROCESSING
        order.save(update_fields=['status', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.PROCESSING, request.user,
                         request.data.get('notes', 'Order processing started'))
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'])
    def pack(self, request, pk=None):
        """Mark order as packed."""
        order = self.get_object()
        
        if order.status != SOStatus.PROCESSING:
            return Response({
                'success': False,
                'error': {'message': f'Cannot pack order in {order.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = order.status
        order.status = SOStatus.PACKED
        order.save(update_fields=['status', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.PACKED, request.user,
                         request.data.get('notes', 'Order packed'))
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'], url_path='ready-for-pickup')
    def ready_for_pickup(self, request, pk=None):
        """Mark order as ready for pickup."""
        order = self.get_object()
        
        if order.status != SOStatus.PACKED:
            return Response({
                'success': False,
                'error': {'message': f'Order must be packed first.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = order.status
        order.status = SOStatus.READY_FOR_PICKUP
        order.save(update_fields=['status', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.READY_FOR_PICKUP, request.user,
                         request.data.get('notes', 'Order ready for pickup'))
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order."""
        order = self.get_object()
        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if order.status not in SOStatus.CANCELLABLE_STATES:
            return Response({
                'success': False,
                'error': {'message': f'Cannot cancel order in {order.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = order.status
        order.status = SOStatus.CANCELLED
        order.cancelled_by = request.user
        order.cancelled_at = timezone.now()
        order.cancellation_reason = serializer.validated_data['reason']
        order.save(update_fields=['status', 'cancelled_by', 'cancelled_at', 
                                   'cancellation_reason', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.CANCELLED, request.user,
                         serializer.validated_data['reason'])
        
        # Release inventory reservations
        for item in order.items.all():
            if item.inventory:
                item.inventory.unreserve(item.quantity_ordered)
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """Update order status manually."""
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        if new_status not in [s[0] for s in SOStatus.CHOICES]:
            return Response({
                'success': False,
                'error': {'message': 'Invalid status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = order.status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        
        log_status_change(order, old_status, new_status, request.user,
                         serializer.validated_data.get('notes', ''))
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['get'], url_path='status-logs')
    def status_logs(self, request, pk=None):
        """Get order status change history."""
        order = self.get_object()
        logs = order.status_logs.all()
        return Response({
            'success': True,
            'data': SOStatusLogSerializer(logs, many=True).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'], url_path='assign-delivery')
    def assign_delivery(self, request, pk=None):
        """Assign delivery agent to order."""
        order = self.get_object()
        serializer = AssignDeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if order.status not in [SOStatus.PACKED, SOStatus.READY_FOR_PICKUP]:
            return Response({
                'success': False,
                'error': {'message': 'Order must be packed or ready for pickup.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        agent = DeliveryAgent.objects.filter(id=serializer.validated_data['agent_id']).first()
        if not agent:
            return Response({
                'success': False,
                'error': {'message': 'Delivery agent not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        if agent.status != 'active':
            return Response({
                'success': False,
                'error': {'message': 'Delivery agent is not active.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create delivery assignment
        assignment = DeliveryAssignment.objects.create(
            sales_order=order,
            delivery_agent=agent,
            pickup_address=order.vendor.get_address_dict() if hasattr(order.vendor, 'get_address_dict') else {},
            delivery_address=order.shipping_address_snapshot or {},
            delivery_contact_name=order.shipping_address_snapshot.get('full_name', '') if order.shipping_address_snapshot else '',
            delivery_contact_phone=order.shipping_address_snapshot.get('phone', '') if order.shipping_address_snapshot else '',
            estimated_delivery_time=serializer.validated_data.get('estimated_delivery_time'),
            cod_amount=order.total_amount if order.payment_method == 'cod' else 0,
            notes=serializer.validated_data.get('notes', ''),
            assigned_by=request.user,
        )
        
        # Update order status
        old_status = order.status
        order.status = SOStatus.OUT_FOR_DELIVERY
        order.save(update_fields=['status', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.OUT_FOR_DELIVERY, request.user,
                         f'Assigned to delivery agent: {agent.user.email}')
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'], url_path='approve-return')
    def approve_return(self, request, pk=None):
        """Approve return request."""
        order = self.get_object()
        
        if order.status != SOStatus.RETURN_REQUESTED:
            return Response({
                'success': False,
                'error': {'message': 'No return request pending.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = order.status
        order.status = SOStatus.RETURN_APPROVED
        order.save(update_fields=['status', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.RETURN_APPROVED, request.user, 'Return approved')
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })
    
    @extend_schema(tags=['Sales Orders'])
    @action(detail=True, methods=['post'], url_path='reject-return')
    def reject_return(self, request, pk=None):
        """Reject return request."""
        order = self.get_object()
        
        if order.status != SOStatus.RETURN_REQUESTED:
            return Response({
                'success': False,
                'error': {'message': 'No return request pending.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        old_status = order.status
        order.status = SOStatus.RETURN_REJECTED
        order.save(update_fields=['status', 'updated_at'])
        
        log_status_change(order, old_status, SOStatus.RETURN_REJECTED, request.user, f'Return rejected: {reason}')
        
        return Response({
            'success': True,
            'data': SalesOrderSerializer(order).data
        })

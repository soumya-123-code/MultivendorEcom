"""
Payment views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone
import uuid

from apps.payments.models import Payment, Refund
from apps.payments.serializers import (
    PaymentSerializer,
    PaymentListSerializer,
    PaymentCreateSerializer,
    PaymentConfirmSerializer,
    RefundSerializer,
    RefundListSerializer,
    RefundCreateSerializer,
    RefundProcessSerializer,
)
from apps.sales_orders.models import SalesOrder
from core.permissions import IsAdmin, IsVendorOrAdmin
from core.utils.constants import PaymentStatus


def generate_payment_number():
    """Generate unique payment number."""
    return f"PAY-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


def generate_refund_number():
    """Generate unique refund number."""
    return f"REF-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for payment management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['payment_number', 'gateway_transaction_id']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'payment_method', 'vendor', 'customer']
    http_method_names = ['get', 'post']
    
    def get_permissions(self):
        if self.action in ['initiate', 'confirm']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related(
            'sales_order', 'vendor', 'customer', 'customer__user'
        ).prefetch_related('refunds')
        
        # Admins see all payments
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see their payments
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)
        
        # Customers see their payments
        if user.role == 'customer' and hasattr(user, 'customer'):
            return queryset.filter(customer=user.customer)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PaymentListSerializer
        if self.action == 'initiate':
            return PaymentCreateSerializer
        if self.action == 'confirm':
            return PaymentConfirmSerializer
        return PaymentSerializer
    
    @extend_schema(tags=['Payments'])
    def list(self, request, *args, **kwargs):
        """List payments."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Payments'])
    def retrieve(self, request, *args, **kwargs):
        """Get payment details."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(tags=['Payments'])
    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Initiate a payment for an order."""
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Get order
        order = SalesOrder.objects.filter(id=data['sales_order']).first()
        if not order:
            return Response({
                'success': False,
                'error': {'message': 'Order not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already paid
        if order.payment_status == PaymentStatus.COMPLETED:
            return Response({
                'success': False,
                'error': {'message': 'Order is already paid.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment
        payment = Payment.objects.create(
            sales_order=order,
            vendor=order.vendor,
            customer=order.customer,
            payment_number=generate_payment_number(),
            amount=order.total_amount,
            payment_method=data['payment_method'],
            payment_gateway=data.get('payment_gateway', ''),
            status=PaymentStatus.PENDING,
        )
        
        # For COD, mark as pending collection
        if data['payment_method'] == 'cod':
            order.payment_method = 'cod'
            order.save(update_fields=['payment_method', 'updated_at'])
        
        return Response({
            'success': True,
            'data': PaymentSerializer(payment).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Payments'])
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a payment (after gateway callback)."""
        payment = self.get_object()
        serializer = PaymentConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        if payment.status != PaymentStatus.PENDING:
            return Response({
                'success': False,
                'error': {'message': f'Cannot confirm payment in {payment.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update payment
        payment.gateway_transaction_id = data['gateway_transaction_id']
        payment.gateway_response = data.get('gateway_response')
        payment.status = PaymentStatus.COMPLETED
        payment.paid_at = timezone.now()
        payment.save(update_fields=[
            'gateway_transaction_id', 'gateway_response', 
            'status', 'paid_at', 'updated_at'
        ])
        
        # Update order payment status
        order = payment.sales_order
        order.payment_status = PaymentStatus.COMPLETED
        order.save(update_fields=['payment_status', 'updated_at'])
        
        return Response({
            'success': True,
            'data': PaymentSerializer(payment).data
        })
    
    @extend_schema(tags=['Payments'])
    @action(detail=True, methods=['post'])
    def fail(self, request, pk=None):
        """Mark payment as failed."""
        payment = self.get_object()
        
        if payment.status != PaymentStatus.PENDING:
            return Response({
                'success': False,
                'error': {'message': f'Cannot fail payment in {payment.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        payment.status = PaymentStatus.FAILED
        payment.gateway_response = request.data.get('gateway_response')
        payment.notes = request.data.get('reason', '')
        payment.save(update_fields=['status', 'gateway_response', 'notes', 'updated_at'])
        
        # Update order payment status
        order = payment.sales_order
        order.payment_status = PaymentStatus.FAILED
        order.save(update_fields=['payment_status', 'updated_at'])
        
        return Response({
            'success': True,
            'data': PaymentSerializer(payment).data
        })
    
    @extend_schema(tags=['Payments'])
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payment summary."""
        from django.db.models import Sum, Count
        
        queryset = self.get_queryset()
        
        summary = {
            'total_payments': queryset.count(),
            'completed': queryset.filter(status=PaymentStatus.COMPLETED).count(),
            'pending': queryset.filter(status=PaymentStatus.PENDING).count(),
            'failed': queryset.filter(status=PaymentStatus.FAILED).count(),
            'total_amount': float(queryset.filter(status=PaymentStatus.COMPLETED).aggregate(
                total=Sum('amount')
            )['total'] or 0),
            'by_method': {
                item['payment_method']: item['count']
                for item in queryset.filter(status=PaymentStatus.COMPLETED).values('payment_method').annotate(count=Count('id'))
            }
        }
        
        return Response({
            'success': True,
            'data': summary
        })


class RefundViewSet(viewsets.ModelViewSet):
    """ViewSet for refund management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['refund_number']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'payment']
    http_method_names = ['get', 'post']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Refund.objects.select_related(
            'payment', 'sales_order', 'processed_by'
        )
        
        # Admins see all refunds
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see their refunds
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(payment__vendor=user.vendor)
        
        # Customers see their refunds
        if user.role == 'customer' and hasattr(user, 'customer'):
            return queryset.filter(payment__customer=user.customer)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RefundListSerializer
        if self.action == 'create':
            return RefundCreateSerializer
        if self.action == 'process':
            return RefundProcessSerializer
        return RefundSerializer
    
    @extend_schema(tags=['Refunds'])
    def list(self, request, *args, **kwargs):
        """List refunds."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Refunds'])
    def retrieve(self, request, *args, **kwargs):
        """Get refund details."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(tags=['Refunds'])
    def create(self, request, *args, **kwargs):
        """Request a refund."""
        serializer = RefundCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Get payment
        payment = Payment.objects.filter(id=data['payment_id']).first()
        if not payment:
            return Response({
                'success': False,
                'error': {'message': 'Payment not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        if payment.status != PaymentStatus.COMPLETED:
            return Response({
                'success': False,
                'error': {'message': 'Can only refund completed payments.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check refund amount
        existing_refunds = payment.refunds.filter(status__in=['pending', 'processing', 'completed']).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        max_refundable = float(payment.amount) - float(existing_refunds)
        if float(data['amount']) > max_refundable:
            return Response({
                'success': False,
                'error': {'message': f'Maximum refundable amount is {max_refundable}'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create refund
        refund = Refund.objects.create(
            payment=payment,
            sales_order=payment.sales_order,
            refund_number=generate_refund_number(),
            amount=data['amount'],
            reason=data['reason'],
            status='pending',
        )
        
        return Response({
            'success': True,
            'data': RefundSerializer(refund).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Refunds (Admin)'])
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a refund (approve/reject)."""
        refund = self.get_object()
        serializer = RefundProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        if refund.status != 'pending':
            return Response({
                'success': False,
                'error': {'message': f'Cannot process refund in {refund.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if data['action'] == 'approve':
            refund.status = 'completed'
            refund.gateway_refund_id = data.get('gateway_refund_id', '')
            
            # Update payment/order status if fully refunded
            payment = refund.payment
            total_refunded = payment.refunds.filter(status='completed').aggregate(
                total=Sum('amount')
            )['total'] or 0
            total_refunded += float(refund.amount)
            
            if total_refunded >= float(payment.amount):
                payment.status = PaymentStatus.REFUNDED
                payment.save(update_fields=['status', 'updated_at'])
                
                order = payment.sales_order
                order.payment_status = PaymentStatus.REFUNDED
                order.save(update_fields=['payment_status', 'updated_at'])
        else:
            refund.status = 'rejected'
        
        refund.processed_by = request.user
        refund.processed_at = timezone.now()
        refund.save(update_fields=[
            'status', 'gateway_refund_id', 'processed_by', 'processed_at', 'updated_at'
        ])
        
        return Response({
            'success': True,
            'data': RefundSerializer(refund).data
        })

"""
VendorOrder views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from apps.sales_orders.models import VendorOrder, VendorOrderItem, VendorOrderStatusLog
from apps.sales_orders.serializers import (
    VendorOrderSerializer,
    VendorOrderListSerializer,
    VendorOrderDetailSerializer,
    VendorOrderStatusLogSerializer,
)
from core.permissions import IsAdmin, IsVendorOrAdmin
from core.utils.constants import SOStatus


def log_vendor_order_status(vendor_order, old_status, new_status, user, notes=None):
    """Create status log entry for vendor order."""
    VendorOrderStatusLog.objects.create(
        vendor_order=vendor_order,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
        changed_by=user
    )


class VendorOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor order management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['order_number', 'sales_order__order_number']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'payment_status', 'vendor', 'is_settled']

    def get_permissions(self):
        return [IsAuthenticated(), IsVendorOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = VendorOrder.objects.select_related(
            'vendor', 'sales_order', 'sales_order__customer', 'sales_order__customer__user'
        ).prefetch_related('items', 'status_logs')

        # Admins see all vendor orders
        if user.role in ['super_admin', 'admin']:
            return queryset

        # Vendors see only their orders
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)

        return queryset.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return VendorOrderListSerializer
        if self.action == 'retrieve':
            return VendorOrderDetailSerializer
        return VendorOrderSerializer

    @extend_schema(tags=['Vendor Orders'])
    def list(self, request, *args, **kwargs):
        """List vendor orders."""
        return super().list(request, *args, **kwargs)

    @extend_schema(tags=['Vendor Orders'])
    def retrieve(self, request, *args, **kwargs):
        """Get vendor order details."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(tags=['Vendor Orders'])
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm vendor order."""
        vendor_order = self.get_object()
        if vendor_order.status != SOStatus.PENDING:
            return Response({
                'success': False,
                'error': {'message': 'Only pending orders can be confirmed'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = vendor_order.status
        vendor_order.status = SOStatus.CONFIRMED
        vendor_order.save(update_fields=['status', 'updated_at'])
        log_vendor_order_status(vendor_order, old_status, SOStatus.CONFIRMED, request.user)

        return Response({
            'success': True,
            'data': VendorOrderDetailSerializer(vendor_order).data
        })

    @extend_schema(tags=['Vendor Orders'])
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Start processing vendor order."""
        vendor_order = self.get_object()
        if vendor_order.status != SOStatus.CONFIRMED:
            return Response({
                'success': False,
                'error': {'message': 'Only confirmed orders can be processed'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = vendor_order.status
        vendor_order.status = SOStatus.PROCESSING
        vendor_order.save(update_fields=['status', 'updated_at'])
        log_vendor_order_status(vendor_order, old_status, SOStatus.PROCESSING, request.user)

        return Response({
            'success': True,
            'data': VendorOrderDetailSerializer(vendor_order).data
        })

    @extend_schema(tags=['Vendor Orders'])
    @action(detail=True, methods=['post'])
    def pack(self, request, pk=None):
        """Mark vendor order as packed."""
        vendor_order = self.get_object()
        if vendor_order.status != SOStatus.PROCESSING:
            return Response({
                'success': False,
                'error': {'message': 'Only processing orders can be packed'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = vendor_order.status
        vendor_order.status = SOStatus.PACKED
        vendor_order.packed_at = timezone.now()
        vendor_order.save(update_fields=['status', 'packed_at', 'updated_at'])
        log_vendor_order_status(vendor_order, old_status, SOStatus.PACKED, request.user)

        return Response({
            'success': True,
            'data': VendorOrderDetailSerializer(vendor_order).data
        })

    @extend_schema(tags=['Vendor Orders'])
    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """Mark vendor order as shipped."""
        vendor_order = self.get_object()
        if vendor_order.status not in [SOStatus.PACKED, SOStatus.READY_FOR_PICKUP]:
            return Response({
                'success': False,
                'error': {'message': 'Order must be packed or ready for pickup'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = vendor_order.status
        vendor_order.status = SOStatus.SHIPPED
        vendor_order.shipped_at = timezone.now()
        vendor_order.save(update_fields=['status', 'shipped_at', 'updated_at'])
        log_vendor_order_status(vendor_order, old_status, SOStatus.SHIPPED, request.user)

        return Response({
            'success': True,
            'data': VendorOrderDetailSerializer(vendor_order).data
        })

    @extend_schema(tags=['Vendor Orders'])
    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        """Mark vendor order as delivered."""
        vendor_order = self.get_object()
        if vendor_order.status != SOStatus.SHIPPED:
            return Response({
                'success': False,
                'error': {'message': 'Only shipped orders can be delivered'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = vendor_order.status
        vendor_order.status = SOStatus.DELIVERED
        vendor_order.delivered_at = timezone.now()
        vendor_order.save(update_fields=['status', 'delivered_at', 'updated_at'])
        log_vendor_order_status(vendor_order, old_status, SOStatus.DELIVERED, request.user)

        return Response({
            'success': True,
            'data': VendorOrderDetailSerializer(vendor_order).data
        })

    @extend_schema(tags=['Vendor Orders'])
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get vendor order statistics."""
        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status=SOStatus.PENDING).count(),
            'processing': queryset.filter(status=SOStatus.PROCESSING).count(),
            'shipped': queryset.filter(status=SOStatus.SHIPPED).count(),
            'delivered': queryset.filter(status=SOStatus.DELIVERED).count(),
            'unsettled': queryset.filter(is_settled=False).count(),
        }

        return Response({
            'success': True,
            'data': stats
        })

"""
Vendor Settlement views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.db.models import Sum
import uuid

from apps.vendors.models import VendorSettlement, VendorPayout, VendorLedger, CommissionRecord
from apps.vendors.serializers import (
    VendorSettlementSerializer,
    VendorSettlementListSerializer,
    VendorSettlementDetailSerializer,
    VendorPayoutSerializer,
    VendorPayoutListSerializer,
    VendorLedgerSerializer,
    CommissionRecordSerializer,
)
from core.permissions import IsAdmin, IsVendorOrAdmin


class VendorSettlementViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor settlement management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['settlement_number', 'vendor__store_name']
    ordering_fields = ['created_at', 'period_start', 'period_end', 'net_payable']
    ordering = ['-created_at']
    filterset_fields = ['status', 'vendor']

    def get_permissions(self):
        return [IsAuthenticated(), IsVendorOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = VendorSettlement.objects.select_related('vendor').prefetch_related('vendor_orders')

        # Admins see all settlements
        if user.role in ['super_admin', 'admin']:
            return queryset

        # Vendors see only their settlements
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)

        return queryset.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return VendorSettlementListSerializer
        if self.action == 'retrieve':
            return VendorSettlementDetailSerializer
        return VendorSettlementSerializer

    @extend_schema(tags=['Vendor Settlements'])
    def list(self, request, *args, **kwargs):
        """List vendor settlements."""
        return super().list(request, *args, **kwargs)

    @extend_schema(tags=['Vendor Settlements'])
    def retrieve(self, request, *args, **kwargs):
        """Get settlement details."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(tags=['Vendor Settlements'])
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate settlement for a vendor."""
        from apps.sales_orders.models import VendorOrder

        vendor_id = request.data.get('vendor_id')
        period_start = request.data.get('period_start')
        period_end = request.data.get('period_end')

        if not all([vendor_id, period_start, period_end]):
            return Response({
                'success': False,
                'error': {'message': 'vendor_id, period_start, and period_end are required'}
            }, status=status.HTTP_400_BAD_REQUEST)

        from apps.vendors.models import Vendor
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Vendor not found'}
            }, status=status.HTTP_404_NOT_FOUND)

        # Get unsettled delivered orders in the period
        unsettled_orders = VendorOrder.objects.filter(
            vendor=vendor,
            is_settled=False,
            status='delivered',
            delivered_at__date__gte=period_start,
            delivered_at__date__lte=period_end
        )

        if not unsettled_orders.exists():
            return Response({
                'success': False,
                'error': {'message': 'No unsettled orders found for this period'}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate amounts
        totals = unsettled_orders.aggregate(
            gross=Sum('total_amount'),
            commission=Sum('commission_amount'),
            earning=Sum('vendor_earning')
        )

        # Create settlement
        settlement = VendorSettlement.objects.create(
            vendor=vendor,
            settlement_number=f"SET-{uuid.uuid4().hex[:8].upper()}",
            period_start=period_start,
            period_end=period_end,
            gross_amount=totals['gross'] or 0,
            commission_amount=totals['commission'] or 0,
            net_payable=totals['earning'] or 0,
            status='draft'
        )

        # Link orders to settlement
        unsettled_orders.update(settlement=settlement)

        return Response({
            'success': True,
            'data': VendorSettlementDetailSerializer(settlement).data
        }, status=status.HTTP_201_CREATED)

    @extend_schema(tags=['Vendor Settlements'])
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a settlement."""
        settlement = self.get_object()
        if settlement.status != 'draft':
            return Response({
                'success': False,
                'error': {'message': 'Only draft settlements can be approved'}
            }, status=status.HTTP_400_BAD_REQUEST)

        settlement.status = 'approved'
        settlement.approved_by = request.user
        settlement.approved_at = timezone.now()
        settlement.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])

        return Response({
            'success': True,
            'data': VendorSettlementDetailSerializer(settlement).data
        })

    @extend_schema(tags=['Vendor Settlements'])
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process payment for settlement."""
        settlement = self.get_object()
        if settlement.status != 'approved':
            return Response({
                'success': False,
                'error': {'message': 'Settlement must be approved first'}
            }, status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get('payment_method', 'bank_transfer')
        transaction_id = request.data.get('transaction_id')

        # Create payout record
        payout = VendorPayout.objects.create(
            vendor=settlement.vendor,
            settlement=settlement,
            payout_number=f"PAY-{uuid.uuid4().hex[:8].upper()}",
            amount=settlement.net_payable,
            payment_method=payment_method,
            status='processing'
        )

        if transaction_id:
            payout.transaction_id = transaction_id
            payout.status = 'completed'
            payout.completed_at = timezone.now()
            payout.save(update_fields=['transaction_id', 'status', 'completed_at'])

        settlement.status = 'paid'
        settlement.paid_at = timezone.now()
        settlement.save(update_fields=['status', 'paid_at', 'updated_at'])

        # Mark orders as settled
        settlement.vendor_orders.update(is_settled=True)

        # Create ledger entry
        VendorLedger.objects.create(
            vendor=settlement.vendor,
            entry_type='credit',
            amount=settlement.net_payable,
            balance_after=0,  # Would need to calculate running balance
            description=f"Settlement #{settlement.settlement_number}",
            settlement=settlement,
            payout=payout
        )

        return Response({
            'success': True,
            'data': VendorSettlementDetailSerializer(settlement).data
        })

    @extend_schema(tags=['Vendor Settlements'])
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get settlement statistics."""
        from django.db.models import Sum

        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'draft': queryset.filter(status='draft').count(),
            'approved': queryset.filter(status='approved').count(),
            'paid': queryset.filter(status='paid').count(),
            'total_gross': queryset.aggregate(total=Sum('gross_amount'))['total'] or 0,
            'total_commission': queryset.aggregate(total=Sum('commission_amount'))['total'] or 0,
            'total_paid': queryset.filter(status='paid').aggregate(total=Sum('net_payable'))['total'] or 0,
            'pending_payment': queryset.filter(status='approved').aggregate(total=Sum('net_payable'))['total'] or 0,
        }

        return Response({
            'success': True,
            'data': stats
        })


class VendorPayoutViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for vendor payouts (read-only for vendors)."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['payout_number', 'transaction_id']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    filterset_fields = ['status', 'payment_method', 'vendor']

    def get_permissions(self):
        return [IsAuthenticated(), IsVendorOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = VendorPayout.objects.select_related('vendor', 'settlement')

        if user.role in ['super_admin', 'admin']:
            return queryset

        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)

        return queryset.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return VendorPayoutListSerializer
        return VendorPayoutSerializer

    @extend_schema(tags=['Vendor Payouts'])
    def list(self, request, *args, **kwargs):
        """List vendor payouts."""
        return super().list(request, *args, **kwargs)


class VendorLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for vendor ledger entries."""
    serializer_class = VendorLedgerSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    filterset_fields = ['entry_type', 'vendor']

    def get_permissions(self):
        return [IsAuthenticated(), IsVendorOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = VendorLedger.objects.select_related('vendor', 'settlement', 'payout')

        if user.role in ['super_admin', 'admin']:
            return queryset

        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)

        return queryset.none()

    @extend_schema(tags=['Vendor Ledger'])
    def list(self, request, *args, **kwargs):
        """List vendor ledger entries."""
        return super().list(request, *args, **kwargs)


class CommissionRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for commission records."""
    serializer_class = CommissionRecordSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    filterset_fields = ['vendor']
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return CommissionRecord.objects.select_related('vendor', 'vendor_order')

    @extend_schema(tags=['Commission Records'])
    def list(self, request, *args, **kwargs):
        """List commission records."""
        return super().list(request, *args, **kwargs)

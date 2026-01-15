"""
Return Request views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from apps.sales_orders.models import ReturnRequest, ReturnItem, ReturnStatusLog
from apps.sales_orders.serializers import (
    ReturnRequestSerializer,
    ReturnRequestListSerializer,
    ReturnRequestDetailSerializer,
    ReturnRequestCreateSerializer,
    ReturnStatusLogSerializer,
)
from core.permissions import IsAdmin, IsVendorOrAdmin


def log_return_status(return_request, old_status, new_status, user, notes=None):
    """Create status log entry for return request."""
    ReturnStatusLog.objects.create(
        return_request=return_request,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
        changed_by=user
    )


class ReturnRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for return request management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['return_number', 'vendor_order__order_number']
    ordering_fields = ['created_at', 'status', 'refund_amount']
    ordering = ['-created_at']
    filterset_fields = ['status', 'return_type', 'reason']

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsVendorOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = ReturnRequest.objects.select_related(
            'vendor_order', 'vendor_order__vendor', 'customer', 'customer__user'
        ).prefetch_related('items', 'status_logs')

        # Admins see all returns
        if user.role in ['super_admin', 'admin']:
            return queryset

        # Vendors see returns for their orders
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor_order__vendor=user.vendor)

        # Customers see their own returns
        if user.role == 'customer' and hasattr(user, 'customer'):
            return queryset.filter(customer=user.customer)

        return queryset.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return ReturnRequestListSerializer
        if self.action == 'create':
            return ReturnRequestCreateSerializer
        if self.action == 'retrieve':
            return ReturnRequestDetailSerializer
        return ReturnRequestSerializer

    @extend_schema(tags=['Returns'])
    def list(self, request, *args, **kwargs):
        """List return requests."""
        return super().list(request, *args, **kwargs)

    @extend_schema(tags=['Returns'])
    def create(self, request, *args, **kwargs):
        """Create a new return request."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set customer from authenticated user
        customer = getattr(request.user, 'customer', None)
        if not customer:
            return Response({
                'success': False,
                'error': {'message': 'Customer profile required'}
            }, status=status.HTTP_400_BAD_REQUEST)

        return_request = serializer.save(customer=customer)
        log_return_status(return_request, None, 'requested', request.user)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        }, status=status.HTTP_201_CREATED)

    @extend_schema(tags=['Returns'])
    def retrieve(self, request, *args, **kwargs):
        """Get return request details."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(tags=['Returns'])
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve return request."""
        return_request = self.get_object()
        if return_request.status != 'requested':
            return Response({
                'success': False,
                'error': {'message': 'Only requested returns can be approved'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = return_request.status
        return_request.status = 'approved'
        return_request.approved_by = request.user
        return_request.approved_at = timezone.now()

        # Approve all items
        for item in return_request.items.all():
            item.quantity_approved = item.quantity_requested
            item.save(update_fields=['quantity_approved'])

        return_request.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])
        log_return_status(return_request, old_status, 'approved', request.user)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        })

    @extend_schema(tags=['Returns'])
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject return request."""
        return_request = self.get_object()
        if return_request.status != 'requested':
            return Response({
                'success': False,
                'error': {'message': 'Only requested returns can be rejected'}
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')
        if not reason:
            return Response({
                'success': False,
                'error': {'message': 'Rejection reason is required'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = return_request.status
        return_request.status = 'rejected'
        return_request.rejected_by = request.user
        return_request.rejected_at = timezone.now()
        return_request.rejection_reason = reason
        return_request.save(update_fields=['status', 'rejected_by', 'rejected_at', 'rejection_reason', 'updated_at'])
        log_return_status(return_request, old_status, 'rejected', request.user, reason)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        })

    @extend_schema(tags=['Returns'])
    @action(detail=True, methods=['post'])
    def schedule_pickup(self, request, pk=None):
        """Schedule return pickup."""
        return_request = self.get_object()
        if return_request.status != 'approved':
            return Response({
                'success': False,
                'error': {'message': 'Only approved returns can be scheduled for pickup'}
            }, status=status.HTTP_400_BAD_REQUEST)

        pickup_date = request.data.get('pickup_date')
        agent_id = request.data.get('agent_id')

        old_status = return_request.status
        return_request.status = 'pickup_scheduled'
        return_request.pickup_scheduled_date = pickup_date

        if agent_id:
            from apps.delivery_agents.models import DeliveryAgent
            try:
                agent = DeliveryAgent.objects.get(id=agent_id)
                return_request.pickup_agent = agent
            except DeliveryAgent.DoesNotExist:
                pass

        return_request.save(update_fields=['status', 'pickup_scheduled_date', 'pickup_agent', 'updated_at'])
        log_return_status(return_request, old_status, 'pickup_scheduled', request.user)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        })

    @extend_schema(tags=['Returns'])
    @action(detail=True, methods=['post'])
    def complete_pickup(self, request, pk=None):
        """Mark pickup as completed."""
        return_request = self.get_object()
        if return_request.status != 'pickup_scheduled':
            return Response({
                'success': False,
                'error': {'message': 'Pickup must be scheduled first'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = return_request.status
        return_request.status = 'pickup_completed'
        return_request.pickup_completed_date = timezone.now().date()
        return_request.save(update_fields=['status', 'pickup_completed_date', 'updated_at'])
        log_return_status(return_request, old_status, 'pickup_completed', request.user)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        })

    @extend_schema(tags=['Returns'])
    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Mark return as received at warehouse."""
        return_request = self.get_object()
        if return_request.status not in ['pickup_completed', 'in_transit']:
            return Response({
                'success': False,
                'error': {'message': 'Invalid status for receiving'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = return_request.status
        return_request.status = 'received'

        # Update received quantities
        for item in return_request.items.all():
            item.quantity_received = item.quantity_approved
            item.save(update_fields=['quantity_received'])

        return_request.save(update_fields=['status', 'updated_at'])
        log_return_status(return_request, old_status, 'received', request.user)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        })

    @extend_schema(tags=['Returns'])
    @action(detail=True, methods=['post'])
    def inspect(self, request, pk=None):
        """Record inspection results."""
        return_request = self.get_object()
        if return_request.status != 'received':
            return Response({
                'success': False,
                'error': {'message': 'Return must be received first'}
            }, status=status.HTTP_400_BAD_REQUEST)

        result = request.data.get('result')  # passed, failed, partial
        notes = request.data.get('notes', '')

        if result not in ['passed', 'failed', 'partial']:
            return Response({
                'success': False,
                'error': {'message': 'Invalid inspection result'}
            }, status=status.HTTP_400_BAD_REQUEST)

        old_status = return_request.status
        return_request.status = 'inspecting'
        return_request.save(update_fields=['status', 'updated_at'])
        log_return_status(return_request, old_status, 'inspecting', request.user)

        # Complete inspection
        return_request.inspection_result = result
        return_request.inspection_notes = notes
        return_request.inspected_by = request.user
        return_request.inspected_at = timezone.now()

        new_status = 'inspection_passed' if result == 'passed' else 'inspection_failed'
        return_request.status = new_status
        return_request.save(update_fields=[
            'status', 'inspection_result', 'inspection_notes',
            'inspected_by', 'inspected_at', 'updated_at'
        ])
        log_return_status(return_request, 'inspecting', new_status, request.user, notes)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        })

    @extend_schema(tags=['Returns'])
    @action(detail=True, methods=['post'])
    def initiate_refund(self, request, pk=None):
        """Initiate refund for return."""
        return_request = self.get_object()
        if return_request.status != 'inspection_passed':
            return Response({
                'success': False,
                'error': {'message': 'Inspection must pass first'}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate refund amount from items
        refund_amount = sum(
            item.unit_price * item.quantity_approved
            for item in return_request.items.all()
        )

        old_status = return_request.status
        return_request.status = 'refund_initiated'
        return_request.refund_amount = refund_amount
        return_request.refund_method = request.data.get('refund_method', 'original_payment')
        return_request.save(update_fields=['status', 'refund_amount', 'refund_method', 'updated_at'])
        log_return_status(return_request, old_status, 'refund_initiated', request.user)

        return Response({
            'success': True,
            'data': ReturnRequestDetailSerializer(return_request).data
        })

    @extend_schema(tags=['Returns'])
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get return statistics."""
        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'requested': queryset.filter(status='requested').count(),
            'approved': queryset.filter(status='approved').count(),
            'in_progress': queryset.filter(status__in=['pickup_scheduled', 'pickup_completed', 'in_transit', 'received', 'inspecting']).count(),
            'completed': queryset.filter(status__in=['refund_completed', 'replacement_shipped', 'completed']).count(),
            'rejected': queryset.filter(status='rejected').count(),
        }

        return Response({
            'success': True,
            'data': stats
        })

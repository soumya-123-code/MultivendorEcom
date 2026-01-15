"""
Delivery Assignment views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from apps.delivery_agents.models import DeliveryAgent, DeliveryAssignment, DeliveryStatusLog, DeliveryProof
from apps.delivery_agents.serializers import (
    DeliveryAssignmentSerializer,
    DeliveryAssignmentListSerializer,
    DeliveryStatusUpdateSerializer,
    DeliveryCompleteSerializer,
    DeliveryFailSerializer,
    CollectCODSerializer,
    DeliveryStatusLogSerializer,
    DeliveryProofSerializer,
)
from apps.sales_orders.models import SalesOrder
from core.permissions import IsAdmin, IsVendorOrAdmin, IsDeliveryAgent
from core.utils.constants import DeliveryStatus, SOStatus


def log_delivery_status_change(assignment, old_status, new_status, user, notes=None, location=None):
    """Create delivery status log entry."""
    DeliveryStatusLog.objects.create(
        assignment=assignment,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
        location=location,
        updated_by=user
    )


class DeliveryViewSet(viewsets.ModelViewSet):
    """ViewSet for delivery assignment management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['sales_order__order_number', 'delivery_contact_name', 'delivery_contact_phone']
    ordering_fields = ['assigned_at', 'estimated_delivery_time', 'status']
    ordering = ['-assigned_at']
    filterset_fields = ['status', 'delivery_agent', 'cod_collected']
    http_method_names = ['get', 'post', 'patch']  # No delete for deliveries
    
    def get_permissions(self):
        if self.action in ['my_deliveries', 'accept', 'reject', 'pickup', 
                          'in_transit', 'out_for_delivery', 'complete', 
                          'fail', 'collect_cod']:
            return [IsAuthenticated(), IsDeliveryAgent()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = DeliveryAssignment.objects.select_related(
            'sales_order', 'sales_order__customer', 'delivery_agent', 'delivery_agent__user'
        ).prefetch_related('status_logs', 'proofs')
        
        # Admins see all deliveries
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see deliveries for their orders
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(sales_order__vendor=user.vendor)
        
        # Delivery agents see only their deliveries
        if user.role == 'delivery_agent' and hasattr(user, 'delivery_agent'):
            return queryset.filter(delivery_agent=user.delivery_agent)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DeliveryAssignmentListSerializer
        if self.action in ['accept', 'reject', 'pickup', 'in_transit', 'out_for_delivery']:
            return DeliveryStatusUpdateSerializer
        if self.action == 'complete':
            return DeliveryCompleteSerializer
        if self.action == 'fail':
            return DeliveryFailSerializer
        if self.action == 'collect_cod':
            return CollectCODSerializer
        return DeliveryAssignmentSerializer
    
    @extend_schema(tags=['Deliveries'])
    def list(self, request, *args, **kwargs):
        """List delivery assignments."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Deliveries'])
    def retrieve(self, request, *args, **kwargs):
        """Get delivery assignment details."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=False, methods=['get'], url_path='my')
    def my_deliveries(self, request):
        """Get current agent's deliveries."""
        agent = getattr(request.user, 'delivery_agent', None)
        if not agent:
            return Response({
                'success': False,
                'error': {'message': 'No delivery agent profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        status_filter = request.query_params.get('status')
        queryset = agent.assignments.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = DeliveryAssignmentListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'data': serializer.data
        })
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a delivery assignment."""
        delivery = self.get_object()
        
        if delivery.status != DeliveryStatus.ASSIGNED:
            return Response({
                'success': False,
                'error': {'message': f'Cannot accept delivery in {delivery.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify agent
        agent = getattr(request.user, 'delivery_agent', None)
        if delivery.delivery_agent != agent:
            return Response({
                'success': False,
                'error': {'message': 'This delivery is not assigned to you.'}
            }, status=status.HTTP_403_FORBIDDEN)
        
        old_status = delivery.status
        delivery.status = DeliveryStatus.ACCEPTED
        delivery.save(update_fields=['status', 'updated_at'])
        
        log_delivery_status_change(
            delivery, old_status, DeliveryStatus.ACCEPTED, request.user,
            request.data.get('notes'), request.data.get('location')
        )
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })

    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a delivery assignment."""
        delivery = self.get_object()
        
        if delivery.status != DeliveryStatus.ASSIGNED:
            return Response({
                'success': False,
                'error': {'message': f'Cannot reject delivery in {delivery.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = delivery.status
        delivery.status = DeliveryStatus.CANCELLED
        delivery.delivery_agent = None
        delivery.failure_reason = request.data.get('notes', 'Rejected by agent')
        delivery.save(update_fields=['status', 'delivery_agent', 'failure_reason', 'updated_at'])
        
        log_delivery_status_change(
            delivery, old_status, DeliveryStatus.CANCELLED, request.user,
            request.data.get('notes', 'Rejected by agent')
        )
        
        # Update sales order back to packed status
        order = delivery.sales_order
        if order.status == SOStatus.OUT_FOR_DELIVERY:
            order.status = SOStatus.READY_FOR_PICKUP
            order.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'])
    def pickup(self, request, pk=None):
        """Mark delivery as picked up."""
        delivery = self.get_object()
        
        if delivery.status != DeliveryStatus.ACCEPTED:
            return Response({
                'success': False,
                'error': {'message': 'Delivery must be accepted first.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = delivery.status
        delivery.status = DeliveryStatus.PICKED_UP
        delivery.actual_pickup_time = timezone.now()
        delivery.save(update_fields=['status', 'actual_pickup_time', 'updated_at'])
        
        log_delivery_status_change(
            delivery, old_status, DeliveryStatus.PICKED_UP, request.user,
            request.data.get('notes'), request.data.get('location')
        )
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'], url_path='in-transit')
    def in_transit(self, request, pk=None):
        """Mark delivery as in transit."""
        delivery = self.get_object()
        
        if delivery.status != DeliveryStatus.PICKED_UP:
            return Response({
                'success': False,
                'error': {'message': 'Delivery must be picked up first.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = delivery.status
        delivery.status = DeliveryStatus.IN_TRANSIT
        delivery.save(update_fields=['status', 'updated_at'])
        
        log_delivery_status_change(
            delivery, old_status, DeliveryStatus.IN_TRANSIT, request.user,
            request.data.get('notes'), request.data.get('location')
        )
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'], url_path='out-for-delivery')
    def out_for_delivery(self, request, pk=None):
        """Mark delivery as out for delivery."""
        delivery = self.get_object()
        
        if delivery.status not in [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT]:
            return Response({
                'success': False,
                'error': {'message': 'Invalid status for out for delivery.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = delivery.status
        delivery.status = DeliveryStatus.OUT_FOR_DELIVERY
        delivery.save(update_fields=['status', 'updated_at'])
        
        log_delivery_status_change(
            delivery, old_status, DeliveryStatus.OUT_FOR_DELIVERY, request.user,
            request.data.get('notes'), request.data.get('location')
        )
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark delivery as completed."""
        delivery = self.get_object()
        serializer = DeliveryCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if delivery.status not in [DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY]:
            return Response({
                'success': False,
                'error': {'message': 'Delivery must be in transit or out for delivery.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check COD collection
        if delivery.cod_amount > 0 and not delivery.cod_collected:
            return Response({
                'success': False,
                'error': {'message': 'COD must be collected before completing delivery.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create proof
        DeliveryProof.objects.create(
            assignment=delivery,
            proof_type=serializer.validated_data['proof_type'],
            proof_data=serializer.validated_data['proof_data'],
            captured_at=timezone.now(),
            location=serializer.validated_data.get('location')
        )
        
        old_status = delivery.status
        delivery.status = DeliveryStatus.DELIVERED
        delivery.actual_delivery_time = timezone.now()
        delivery.save(update_fields=['status', 'actual_delivery_time', 'updated_at'])
        
        log_delivery_status_change(
            delivery, old_status, DeliveryStatus.DELIVERED, request.user,
            serializer.validated_data.get('notes'), serializer.validated_data.get('location')
        )
        
        # Update sales order
        order = delivery.sales_order
        order.status = SOStatus.DELIVERED
        order.actual_delivery_date = timezone.now().date()
        order.save(update_fields=['status', 'actual_delivery_date', 'updated_at'])
        
        # Update agent stats
        agent = delivery.delivery_agent
        if agent:
            agent.total_deliveries += 1
            agent.successful_deliveries += 1
            agent.save(update_fields=['total_deliveries', 'successful_deliveries', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'])
    def fail(self, request, pk=None):
        """Mark delivery as failed."""
        delivery = self.get_object()
        serializer = DeliveryFailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if delivery.status in [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED]:
            return Response({
                'success': False,
                'error': {'message': 'Cannot mark as failed.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = delivery.status
        delivery.status = DeliveryStatus.FAILED
        delivery.delivery_attempts += 1
        delivery.failure_reason = serializer.validated_data['reason']
        delivery.save(update_fields=['status', 'delivery_attempts', 'failure_reason', 'updated_at'])
        
        log_delivery_status_change(
            delivery, old_status, DeliveryStatus.FAILED, request.user,
            serializer.validated_data.get('notes'), serializer.validated_data.get('location')
        )
        
        # Update sales order
        order = delivery.sales_order
        order.status = SOStatus.DELIVERY_FAILED
        order.save(update_fields=['status', 'updated_at'])
        
        # Update agent stats
        agent = delivery.delivery_agent
        if agent:
            agent.total_deliveries += 1
            agent.failed_deliveries += 1
            agent.save(update_fields=['total_deliveries', 'failed_deliveries', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })
    
    @extend_schema(tags=['Deliveries (Agent)'])
    @action(detail=True, methods=['post'], url_path='collect-cod')
    def collect_cod(self, request, pk=None):
        """Collect COD payment."""
        delivery = self.get_object()
        serializer = CollectCODSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if delivery.cod_amount <= 0:
            return Response({
                'success': False,
                'error': {'message': 'This delivery is not COD.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if delivery.cod_collected:
            return Response({
                'success': False,
                'error': {'message': 'COD already collected.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        collected_amount = serializer.validated_data['amount']
        if float(collected_amount) != float(delivery.cod_amount):
            return Response({
                'success': False,
                'error': {'message': f'Expected COD amount: {delivery.cod_amount}'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        delivery.cod_collected = True
        delivery.save(update_fields=['cod_collected', 'updated_at'])
        
        # Update payment status
        order = delivery.sales_order
        order.payment_status = 'completed'
        order.save(update_fields=['payment_status', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })
    
    @extend_schema(tags=['Deliveries'])
    @action(detail=True, methods=['get'], url_path='status-logs')
    def status_logs(self, request, pk=None):
        """Get delivery status logs."""
        delivery = self.get_object()
        logs = delivery.status_logs.all()
        return Response({
            'success': True,
            'data': DeliveryStatusLogSerializer(logs, many=True).data
        })
    
    @extend_schema(tags=['Deliveries'])
    @action(detail=True, methods=['get', 'post'])
    def proofs(self, request, pk=None):
        """Get or add delivery proofs."""
        delivery = self.get_object()
        
        if request.method == 'GET':
            proofs = delivery.proofs.all()
            return Response({
                'success': True,
                'data': DeliveryProofSerializer(proofs, many=True).data
            })
        
        # POST - add proof
        serializer = DeliveryProofSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        proof = DeliveryProof.objects.create(
            assignment=delivery,
            captured_at=timezone.now(),
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'data': DeliveryProofSerializer(proof).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Deliveries (Admin)'])
    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        """Reassign delivery to another agent."""
        delivery = self.get_object()
        
        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response({
                'success': False,
                'error': {'message': 'agent_id is required.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        new_agent = DeliveryAgent.objects.filter(id=agent_id, status='active').first()
        if not new_agent:
            return Response({
                'success': False,
                'error': {'message': 'Agent not found or not active.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        old_agent = delivery.delivery_agent
        delivery.delivery_agent = new_agent
        delivery.status = DeliveryStatus.ASSIGNED
        delivery.save(update_fields=['delivery_agent', 'status', 'updated_at'])
        
        log_delivery_status_change(
            delivery, delivery.status, DeliveryStatus.ASSIGNED, request.user,
            f'Reassigned from {old_agent.user.email if old_agent else "none"} to {new_agent.user.email}'
        )
        
        return Response({
            'success': True,
            'data': DeliveryAssignmentSerializer(delivery).data
        })


class DeliveryProofViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for delivery proofs."""
    serializer_class = DeliveryProofSerializer
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['assignment', 'proof_type']
    ordering = ['-captured_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = DeliveryProof.objects.select_related(
            'assignment', 'assignment__sales_order', 'assignment__delivery_agent'
        )
        
        # Admins see all proofs
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see proofs for their orders
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(assignment__sales_order__vendor=user.vendor)
        
        # Delivery agents see proofs for their deliveries
        if user.role == 'delivery_agent' and hasattr(user, 'delivery_agent'):
            return queryset.filter(assignment__delivery_agent=user.delivery_agent)
            
        return queryset.none()


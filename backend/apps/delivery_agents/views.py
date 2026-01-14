"""
Delivery Agent views.
"""
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from apps.delivery_agents.models import DeliveryAgent
from apps.delivery_agents.serializers import (
    DeliveryAgentSerializer,
    DeliveryAgentListSerializer,
    DeliveryAgentCreateSerializer,
    DeliveryAgentUpdateSerializer,
    AvailabilitySerializer,
    LocationUpdateSerializer,
)
from core.permissions import IsAdmin, IsVendorOrAdmin, IsDeliveryAgent


class DeliveryAgentViewSet(viewsets.ModelViewSet):
    """ViewSet for delivery agent management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'city']
    ordering_fields = ['created_at', 'rating', 'total_deliveries']
    ordering = ['-created_at']
    filterset_fields = ['status', 'is_available', 'vendor', 'city', 'vehicle_type']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        if self.action in ['list', 'retrieve', 'approve', 'reject', 'suspend', 'activate']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated(), IsVendorOrAdmin()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = DeliveryAgent.objects.select_related('user', 'vendor')
        
        # Admins see all
        if user.role in ['super_admin', 'admin']:
            return queryset
        
        # Vendors see their agents
        if user.role == 'vendor' and hasattr(user, 'vendor'):
            return queryset.filter(vendor=user.vendor)
        
        return queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DeliveryAgentListSerializer
        if self.action == 'create':
            return DeliveryAgentCreateSerializer
        if self.action in ['update', 'partial_update']:
            return DeliveryAgentUpdateSerializer
        return DeliveryAgentSerializer
    
    @extend_schema(tags=['Delivery Agents'])
    def create(self, request, *args, **kwargs):
        """Create delivery agent profile for current user."""
        if hasattr(request.user, 'delivery_agent'):
            return Response({
                'success': False,
                'error': {'message': 'Delivery agent profile already exists.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        agent = DeliveryAgent.objects.create(
            user=request.user,
            **serializer.validated_data
        )
        
        # Update user role
        request.user.role = 'delivery_agent'
        request.user.save(update_fields=['role'])
        
        return Response({
            'success': True,
            'data': DeliveryAgentSerializer(agent).data
        }, status=status.HTTP_201_CREATED)
    
    @extend_schema(tags=['Delivery Agents (Admin)'])
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve delivery agent."""
        agent = self.get_object()
        
        if agent.status not in ['pending']:
            return Response({
                'success': False,
                'error': {'message': f'Cannot approve agent in {agent.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        agent.status = 'approved'
        agent.approved_by = request.user
        agent.approved_at = timezone.now()
        agent.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAgentSerializer(agent).data
        })
    
    @extend_schema(tags=['Delivery Agents (Admin)'])
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject delivery agent."""
        agent = self.get_object()
        
        if agent.status not in ['pending']:
            return Response({
                'success': False,
                'error': {'message': f'Cannot reject agent in {agent.status} status.'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        agent.status = 'inactive'
        agent.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAgentSerializer(agent).data
        })
    
    @extend_schema(tags=['Delivery Agents (Admin)'])
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend delivery agent."""
        agent = self.get_object()
        
        agent.status = 'suspended'
        agent.is_available = False
        agent.save(update_fields=['status', 'is_available', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAgentSerializer(agent).data
        })
    
    @extend_schema(tags=['Delivery Agents (Admin)'])
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate delivery agent."""
        agent = self.get_object()
        
        agent.status = 'active'
        agent.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'success': True,
            'data': DeliveryAgentSerializer(agent).data
        })
    
    @extend_schema(tags=['Delivery Agents'])
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available delivery agents."""
        queryset = self.get_queryset().filter(
            status='active',
            is_available=True
        )
        serializer = DeliveryAgentListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class CurrentDeliveryAgentView(APIView):
    """View for current user's delivery agent profile."""
    permission_classes = [IsAuthenticated, IsDeliveryAgent]
    
    @extend_schema(responses={200: DeliveryAgentSerializer}, tags=['Delivery Agents (Self)'])
    def get(self, request):
        """Get current user's delivery agent profile."""
        agent = getattr(request.user, 'delivery_agent', None)
        if not agent:
            return Response({
                'success': False,
                'error': {'message': 'No delivery agent profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': DeliveryAgentSerializer(agent).data
        })
    
    @extend_schema(request=DeliveryAgentUpdateSerializer, responses={200: DeliveryAgentSerializer}, tags=['Delivery Agents (Self)'])
    def patch(self, request):
        """Update current user's delivery agent profile."""
        agent = getattr(request.user, 'delivery_agent', None)
        if not agent:
            return Response({
                'success': False,
                'error': {'message': 'No delivery agent profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = DeliveryAgentUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        for attr, value in serializer.validated_data.items():
            setattr(agent, attr, value)
        agent.save()
        
        return Response({
            'success': True,
            'data': DeliveryAgentSerializer(agent).data
        })


class DeliveryAgentAvailabilityView(APIView):
    """View for setting delivery agent availability."""
    permission_classes = [IsAuthenticated, IsDeliveryAgent]
    
    @extend_schema(request=AvailabilitySerializer, tags=['Delivery Agents (Self)'])
    def post(self, request):
        """Set availability status."""
        agent = getattr(request.user, 'delivery_agent', None)
        if not agent:
            return Response({
                'success': False,
                'error': {'message': 'No delivery agent profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        agent.is_available = serializer.validated_data['is_available']
        agent.save(update_fields=['is_available', 'updated_at'])
        
        return Response({
            'success': True,
            'data': {'is_available': agent.is_available}
        })


class DeliveryAgentLocationView(APIView):
    """View for updating delivery agent location."""
    permission_classes = [IsAuthenticated, IsDeliveryAgent]
    
    @extend_schema(request=LocationUpdateSerializer, tags=['Delivery Agents (Self)'])
    def post(self, request):
        """Update current location."""
        agent = getattr(request.user, 'delivery_agent', None)
        if not agent:
            return Response({
                'success': False,
                'error': {'message': 'No delivery agent profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = LocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        agent.current_location = {
            'latitude': serializer.validated_data['latitude'],
            'longitude': serializer.validated_data['longitude'],
        }
        agent.last_location_update = timezone.now()
        agent.save(update_fields=['current_location', 'last_location_update', 'updated_at'])
        
        return Response({
            'success': True,
            'data': {
                'current_location': agent.current_location,
                'last_location_update': agent.last_location_update
            }
        })


class DeliveryAgentStatsView(APIView):
    """View for delivery agent statistics."""
    permission_classes = [IsAuthenticated, IsDeliveryAgent]
    
    @extend_schema(tags=['Delivery Agents (Self)'])
    def get(self, request):
        """Get delivery statistics."""
        agent = getattr(request.user, 'delivery_agent', None)
        if not agent:
            return Response({
                'success': False,
                'error': {'message': 'No delivery agent profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get today's stats
        from django.db.models import Count, Sum
        from apps.delivery_agents.models import DeliveryAssignment
        
        today = timezone.now().date()
        today_assignments = agent.assignments.filter(created_at__date=today)
        
        stats = {
            'is_available': agent.is_available,
            'total_deliveries': agent.total_deliveries,
            'successful_deliveries': agent.successful_deliveries,
            'failed_deliveries': agent.failed_deliveries,
            'rating': float(agent.rating),
            'success_rate': round((agent.successful_deliveries / agent.total_deliveries * 100), 1) if agent.total_deliveries > 0 else 0,
            'today_deliveries': today_assignments.count(),
            'completed_today': today_assignments.filter(status='delivered').count(),
            'pending_deliveries': agent.assignments.filter(status__in=['assigned', 'accepted', 'picked_up', 'in_transit']).count(),
            'today_earnings': float(today_assignments.filter(status='delivered').aggregate(total=Sum('delivery_fee'))['total'] or 0),
        }
        
        return Response({
            'success': True,
            'data': stats
        })

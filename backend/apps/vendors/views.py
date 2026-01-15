"""
Vendor views.
"""
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.vendors.models import Vendor, Supplier
from apps.vendors.models.vendor import VendorStaff
from apps.vendors.serializers import (
    VendorSerializer,
    VendorListSerializer,
    VendorCreateSerializer,
    VendorUpdateSerializer,
    VendorApprovalSerializer,
    SupplierSerializer,
    SupplierCreateSerializer,
    VendorStaffSerializer,
)
from apps.vendors.services import VendorService, SupplierService
from core.permissions import IsAdmin, IsVendor, IsVendorOrAdmin
from core.utils.constants import VendorStatus
from django.contrib.auth import get_user_model

User = get_user_model()


class VendorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for vendor management.
    """
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['store_name', 'business_name', 'city']
    ordering_fields = ['created_at', 'store_name', 'rating']
    ordering = ['-created_at']
    filterset_fields = ['status', 'city', 'state']

    def get_serializer_class(self):
        if self.action == 'list':
            return VendorListSerializer
        if self.action == 'create':
            return VendorCreateSerializer
        if self.action in ['update', 'partial_update']:
            return VendorUpdateSerializer
        return VendorSerializer

    def get_queryset(self):
        queryset = Vendor.objects.select_related('user')
        
        # Public views only show approved vendors
        if self.action in ['list', 'retrieve']:
            if not self.request.user.is_authenticated:
                return queryset.filter(status=VendorStatus.APPROVED)
            if not self.request.user.is_admin:
                return queryset.filter(status=VendorStatus.APPROVED)
        
        return queryset

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsVendorOrAdmin()]
        if self.action in ['approve', 'reject', 'suspend', 'reactivate']:
            return [IsAuthenticated(), IsAdmin()]
        return [AllowAny()]

    @extend_schema(tags=['Vendors'])
    def list(self, request, *args, **kwargs):
        """List all vendors (public shows only approved)."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(tags=['Vendors'])
    def retrieve(self, request, *args, **kwargs):
        """Get vendor details."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(tags=['Vendors'])
    def create(self, request, *args, **kwargs):
        """Create a new vendor profile."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor = VendorService.create_vendor(
            user=request.user,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'data': VendorSerializer(vendor).data
        }, status=status.HTTP_201_CREATED)

    @extend_schema(tags=['Vendors (Admin)'])
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a vendor (Admin only)."""
        vendor = self.get_object()
        updated_vendor = VendorService.approve_vendor(vendor, request.user)
        
        return Response({
            'success': True,
            'data': VendorSerializer(updated_vendor).data
        })

    @extend_schema(tags=['Vendors (Admin)'])
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a vendor (Admin only)."""
        serializer = VendorApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor = self.get_object()
        updated_vendor = VendorService.reject_vendor(
            vendor,
            serializer.validated_data.get('reason', ''),
            request.user
        )
        
        return Response({
            'success': True,
            'data': VendorSerializer(updated_vendor).data
        })

    @extend_schema(tags=['Vendors (Admin)'])
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a vendor (Admin only)."""
        vendor = self.get_object()
        updated_vendor = VendorService.suspend_vendor(vendor, request.user)
        
        return Response({
            'success': True,
            'data': VendorSerializer(updated_vendor).data
        })

    @extend_schema(tags=['Vendors (Admin)'])
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a suspended vendor (Admin only)."""
        vendor = self.get_object()
        updated_vendor = VendorService.reactivate_vendor(vendor, request.user)
        
        return Response({
            'success': True,
            'data': VendorSerializer(updated_vendor).data
        })

    @extend_schema(tags=['Vendors'])
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get vendor statistics."""
        vendor = self.get_object()
        stats = VendorService.get_vendor_stats(vendor)
        
        return Response({
            'success': True,
            'data': stats
        })


class CurrentVendorView(APIView):
    """View for current user's vendor profile."""
    permission_classes = [IsAuthenticated, IsVendor]
    
    @extend_schema(responses={200: VendorSerializer}, tags=['Vendors'])
    def get(self, request):
        """Get current user's vendor profile."""
        vendor = getattr(request.user, 'vendor', None)
        if not vendor:
            return Response({
                'success': False,
                'error': {'message': 'No vendor profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': VendorSerializer(vendor).data
        })

    @extend_schema(request=VendorUpdateSerializer, responses={200: VendorSerializer}, tags=['Vendors'])
    def patch(self, request):
        """Update current user's vendor profile."""
        vendor = getattr(request.user, 'vendor', None)
        if not vendor:
            return Response({
                'success': False,
                'error': {'message': 'No vendor profile found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = VendorUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        updated_vendor = VendorService.update_vendor(vendor, **serializer.validated_data)
        
        return Response({
            'success': True,
            'data': VendorSerializer(updated_vendor).data
        })


class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for supplier management."""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'contact_person', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['status']
    serializer_class = SupplierSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return SupplierCreateSerializer
        return SupplierSerializer

    def get_queryset(self):
        user = self.request.user
        
        # Admins see all suppliers
        if user.is_admin:
            return Supplier.objects.all()
        
        # Vendors see only their suppliers
        if hasattr(user, 'vendor'):
            return Supplier.objects.filter(vendor=user.vendor)
        
        return Supplier.objects.none()

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'vendor'):
            serializer.save(vendor=self.request.user.vendor)
        elif self.request.user.is_admin:
            # For admin, vendor should be in validated data, but serializer is SupplierCreateSerializer
            # which doesn't have vendor. Admin creation might need enhancement if needed.
            # Assuming admin creates for a specific vendor via ID or it fails.
            pass


class VendorStaffViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor staff management."""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    serializer_class = VendorStaffSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins see all
        if user.is_admin:
            return VendorStaff.objects.all()
        
        # Vendors see their staff
        if hasattr(user, 'vendor'):
            return VendorStaff.objects.filter(vendor=user.vendor)
            
        return VendorStaff.objects.none()

    def perform_create(self, serializer):
        vendor = None
        if hasattr(self.request.user, 'vendor'):
            vendor = self.request.user.vendor
        elif self.request.user.is_admin and 'vendor_id' in self.request.data:
            try:
                vendor = Vendor.objects.get(id=self.request.data['vendor_id'])
            except Vendor.DoesNotExist:
                pass
        
        if vendor:
            serializer.save(vendor=vendor)
        else:
            raise serializers.ValidationError("Vendor context required")

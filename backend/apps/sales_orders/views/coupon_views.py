"""
Coupon views.
"""
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from apps.sales_orders.models import Coupon, CouponUsage
from apps.sales_orders.serializers import (
    CouponSerializer,
    CouponListSerializer,
    CouponDetailSerializer,
    CouponCreateSerializer,
    CouponUsageSerializer,
    CouponValidateSerializer,
)
from core.permissions import IsAdmin


class CouponViewSet(viewsets.ModelViewSet):
    """ViewSet for coupon management."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['created_at', 'valid_from', 'valid_until', 'usage_count']
    ordering = ['-created_at']
    filterset_fields = ['coupon_type', 'applicability', 'is_active', 'is_public']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'validate']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = Coupon.objects.prefetch_related(
            'applicable_categories', 'applicable_products',
            'applicable_vendors', 'applicable_brands'
        )

        # Admins see all coupons
        if user.role in ['super_admin', 'admin']:
            return queryset

        # Regular users see only public and active coupons
        return queryset.filter(is_active=True, is_public=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return CouponListSerializer
        if self.action == 'create':
            return CouponCreateSerializer
        if self.action in ['update', 'partial_update']:
            return CouponCreateSerializer
        if self.action == 'validate':
            return CouponValidateSerializer
        if self.action == 'retrieve':
            return CouponDetailSerializer
        return CouponSerializer

    @extend_schema(tags=['Coupons'])
    def list(self, request, *args, **kwargs):
        """List coupons."""
        return super().list(request, *args, **kwargs)

    @extend_schema(tags=['Coupons'])
    def retrieve(self, request, *args, **kwargs):
        """Get coupon details."""
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(tags=['Coupons'])
    def create(self, request, *args, **kwargs):
        """Create a new coupon."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.save()

        return Response({
            'success': True,
            'data': CouponDetailSerializer(coupon).data
        }, status=status.HTTP_201_CREATED)

    @extend_schema(tags=['Coupons'])
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a coupon code."""
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        coupon = serializer.validated_data['coupon']
        cart_total = serializer.validated_data['cart_total']

        can_use, message = coupon.can_use(request.user, cart_total)

        if not can_use:
            return Response({
                'success': False,
                'error': {'message': message}
            }, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(cart_total)

        return Response({
            'success': True,
            'data': {
                'coupon': CouponSerializer(coupon).data,
                'discount_amount': discount,
                'final_total': cart_total - discount,
            }
        })

    @extend_schema(tags=['Coupons'])
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a coupon."""
        coupon = self.get_object()
        coupon.is_active = True
        coupon.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'data': CouponDetailSerializer(coupon).data
        })

    @extend_schema(tags=['Coupons'])
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a coupon."""
        coupon = self.get_object()
        coupon.is_active = False
        coupon.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'data': CouponDetailSerializer(coupon).data
        })

    @extend_schema(tags=['Coupons'])
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get coupon usage history."""
        coupon = self.get_object()
        usages = CouponUsage.objects.filter(coupon=coupon).select_related(
            'user', 'sales_order'
        ).order_by('-used_at')

        serializer = CouponUsageSerializer(usages, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    @extend_schema(tags=['Coupons'])
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get coupon statistics."""
        from django.db.models import Sum, Count
        from django.utils import timezone

        queryset = Coupon.objects.all()
        now = timezone.now()

        stats = {
            'total': queryset.count(),
            'active': queryset.filter(is_active=True).count(),
            'expired': queryset.filter(valid_until__lt=now).count(),
            'upcoming': queryset.filter(valid_from__gt=now).count(),
            'total_usage': CouponUsage.objects.count(),
            'total_discount_given': CouponUsage.objects.aggregate(
                total=Sum('discount_amount')
            )['total'] or 0,
        }

        return Response({
            'success': True,
            'data': stats
        })


class CouponUsageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing coupon usage (read-only)."""
    serializer_class = CouponUsageSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    ordering_fields = ['used_at', 'discount_amount']
    ordering = ['-used_at']
    filterset_fields = ['coupon']
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return CouponUsage.objects.select_related(
            'coupon', 'user', 'sales_order'
        )

    @extend_schema(tags=['Coupon Usage'])
    def list(self, request, *args, **kwargs):
        """List all coupon usage records."""
        return super().list(request, *args, **kwargs)

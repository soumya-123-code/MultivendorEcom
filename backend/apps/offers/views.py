from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.permissions import IsAdmin
from .models import Coupon
from .serializers import CouponSerializer, CouponValidationSerializer

class CouponViewSet(viewsets.ModelViewSet):
    """ViewSet for managing coupons."""
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    
    def get_permissions(self):
        if self.action in ['validate', 'list']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]
    
    def get_queryset(self):
        if self.action in ['validate', 'list']:
            return Coupon.objects.filter(is_active=True)
        return super().get_queryset()

    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a coupon code."""
        serializer = CouponValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        cart_total = serializer.validated_data['cart_total']
        
        try:
            coupon = self.get_queryset().get(code=code) # Case sensitive? My model says unique code. settings view used upper()
        except Coupon.DoesNotExist:
            # Try upper case
            try:
                coupon = self.get_queryset().get(code=code.upper())
            except Coupon.DoesNotExist:
                return Response(
                    {'error': 'Invalid coupon code'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Check validity
        if not coupon.is_valid():
            return Response(
                {'error': 'Coupon has expired or reached usage limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check minimum purchase
        if cart_total < coupon.min_purchase_amount:
            return Response(
                {
                    'error': f'Minimum purchase of {coupon.min_purchase_amount} required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate discount
        discount_amount = 0
        if coupon.discount_type == 'percentage':
            discount_amount = (cart_total * coupon.discount_value) / 100
            if coupon.max_discount_amount:
                discount_amount = min(discount_amount, coupon.max_discount_amount)
        elif coupon.discount_type == 'fixed':
            discount_amount = coupon.discount_value
        
        return Response({
            'valid': True,
            'coupon': CouponSerializer(coupon).data,
            'discount_amount': float(discount_amount)
        })

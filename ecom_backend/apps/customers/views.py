"""
Customer views.
"""
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from apps.customers.models import Customer, CustomerAddress, Cart, CartItem, Wishlist
from apps.customers.serializers import (
    CustomerSerializer,
    CustomerAddressSerializer,
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
    WishlistSerializer,
)
from apps.products.models import Product
from core.permissions import IsAdmin


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for customer management (Admin)."""
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        return Customer.objects.select_related('user').all()


class CurrentCustomerView(APIView):
    """View for current user's customer profile."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(responses={200: CustomerSerializer}, tags=['Customers'])
    def get(self, request):
        """Get current user's customer profile."""
        customer, created = Customer.objects.get_or_create(user=request.user)
        return Response({
            'success': True,
            'data': CustomerSerializer(customer).data
        })


class CustomerAddressViewSet(viewsets.ModelViewSet):
    """ViewSet for customer addresses."""
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerAddressSerializer
    
    def get_queryset(self):
        customer = getattr(self.request.user, 'customer', None)
        if customer:
            return CustomerAddress.objects.filter(customer=customer, is_active=True)
        return CustomerAddress.objects.none()
    
    def perform_create(self, serializer):
        customer, _ = Customer.objects.get_or_create(user=self.request.user)
        serializer.save(customer=customer)


class CartView(APIView):
    """View for shopping cart."""
    permission_classes = [IsAuthenticated]
    
    def get_cart(self, request):
        """Get or create cart for user."""
        customer, _ = Customer.objects.get_or_create(user=request.user)
        cart, _ = Cart.objects.get_or_create(customer=customer)
        return cart
    
    @extend_schema(responses={200: CartSerializer}, tags=['Cart'])
    def get(self, request):
        """Get current cart."""
        cart = self.get_cart(request)
        return Response({
            'success': True,
            'data': CartSerializer(cart).data
        })
    
    @extend_schema(request=AddToCartSerializer, responses={200: CartSerializer}, tags=['Cart'])
    def post(self, request):
        """Add item to cart."""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cart = self.get_cart(request)
        
        try:
            product = Product.objects.get(id=serializer.validated_data['product_id'])
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Product not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        variant_id = serializer.validated_data.get('variant_id')
        quantity = serializer.validated_data['quantity']
        
        # Get or create cart item
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant_id=variant_id,
            defaults={
                'quantity': quantity,
                'unit_price': product.selling_price
            }
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        return Response({
            'success': True,
            'data': CartSerializer(cart).data
        })


class CartItemView(APIView):
    """View for individual cart items."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(request=UpdateCartItemSerializer, responses={200: CartSerializer}, tags=['Cart'])
    def patch(self, request, item_id):
        """Update cart item quantity."""
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        customer = getattr(request.user, 'customer', None)
        if not customer:
            return Response({
                'success': False,
                'error': {'message': 'Customer profile not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__customer=customer
            )
        except CartItem.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Cart item not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        quantity = serializer.validated_data['quantity']
        
        if quantity == 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()
        
        cart = cart_item.cart
        return Response({
            'success': True,
            'data': CartSerializer(cart).data
        })
    
    @extend_schema(tags=['Cart'])
    def delete(self, request, item_id):
        """Remove item from cart."""
        customer = getattr(request.user, 'customer', None)
        if not customer:
            return Response({
                'success': False,
                'error': {'message': 'Customer profile not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__customer=customer
            )
            cart = cart_item.cart
            cart_item.delete()
        except CartItem.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Cart item not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': CartSerializer(cart).data
        })


class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet for wishlist."""
    permission_classes = [IsAuthenticated]
    serializer_class = WishlistSerializer
    
    def get_queryset(self):
        customer = getattr(self.request.user, 'customer', None)
        if customer:
            return Wishlist.objects.filter(customer=customer).select_related('product')
        return Wishlist.objects.none()
    
    @extend_schema(tags=['Wishlist'])
    @action(detail=False, methods=['post'])
    def add(self, request):
        """Add product to wishlist."""
        product_id = request.data.get('product_id')
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Product not found.'}
            }, status=status.HTTP_404_NOT_FOUND)
        
        customer, _ = Customer.objects.get_or_create(user=request.user)
        wishlist, created = Wishlist.objects.get_or_create(
            customer=customer,
            product=product
        )
        
        return Response({
            'success': True,
            'data': WishlistSerializer(wishlist).data,
            'created': created
        })
    
    @extend_schema(tags=['Wishlist'])
    @action(detail=False, methods=['delete'])
    def remove(self, request):
        """Remove product from wishlist."""
        product_id = request.data.get('product_id')
        
        customer = getattr(request.user, 'customer', None)
        if customer:
            Wishlist.objects.filter(
                customer=customer,
                product_id=product_id
            ).delete()
        
        return Response({
            'success': True,
            'message': 'Item removed from wishlist.'
        })

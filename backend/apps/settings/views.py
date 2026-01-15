"""
Views for settings app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models import (
    StoreSettings, CurrencySettings, StoreLocation,
    ShippingMethod, TaxSettings, CheckoutSettings,
    InvoiceSettings, ReturnPolicy, ProductComparison
)
from .serializers import (
    StoreSettingsSerializer, CurrencySettingsSerializer, StoreLocationSerializer,
    ShippingMethodSerializer, TaxSettingsSerializer, CheckoutSettingsSerializer,
    InvoiceSettingsSerializer, ReturnPolicySerializer,
    ProductComparisonSerializer
)


class StoreSettingsViewSet(viewsets.ModelViewSet):
    """Store settings management."""
    queryset = StoreSettings.objects.all()
    serializer_class = StoreSettingsSerializer
    permission_classes = [AllowAny]  # Public access for store info
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get current active store settings."""
        settings = self.queryset.first()
        if settings:
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        return Response(
            {'error': 'Store settings not configured'},
            status=status.HTTP_404_NOT_FOUND
        )


class CurrencySettingsViewSet(viewsets.ModelViewSet):
    """Currency settings management."""
    queryset = CurrencySettings.objects.all()
    serializer_class = CurrencySettingsSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get default currency."""
        currency = self.queryset.filter(is_default=True).first()
        if currency:
            serializer = self.get_serializer(currency)
            return Response(serializer.data)
        return Response(
            {'error': 'No default currency set'},
            status=status.HTTP_404_NOT_FOUND
        )


class StoreLocationViewSet(viewsets.ModelViewSet):
    """Store locations management."""
    queryset = StoreLocation.objects.filter(is_active=True)
    serializer_class = StoreLocationSerializer
    permission_classes = [AllowAny]


class ShippingMethodViewSet(viewsets.ModelViewSet):
    """Shipping methods management."""
    queryset = ShippingMethod.objects.filter(is_active=True)
    serializer_class = ShippingMethodSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate shipping cost."""
        cart_total = request.data.get('cart_total', 0)
        country = request.data.get('country', 'India')
        weight = request.data.get('weight', 0)
        
        methods = self.queryset.all()
        available_methods = []
        
        for method in methods:
            # Check country availability
            if method.available_countries and country not in method.available_countries:
                continue
            
            # Check weight limit
            if method.max_weight and weight > method.max_weight:
                continue
            
            # Calculate cost
            cost = method.base_rate
            if weight > 0:
                cost += method.rate_per_kg * weight
            
            # Check for free shipping
            if method.free_shipping_threshold and cart_total >= method.free_shipping_threshold:
                cost = 0
            
            available_methods.append({
                'id': method.id,
                'name': method.name,
                'cost': float(cost),
                'delivery_days': f"{method.min_delivery_days}-{method.max_delivery_days}",
            })
        
        return Response(available_methods)


class TaxSettingsViewSet(viewsets.ModelViewSet):
    """Tax settings management."""
    queryset = TaxSettings.objects.filter(is_active=True)
    serializer_class = TaxSettingsSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate tax for an order."""
        subtotal = request.data.get('subtotal', 0)
        country = request.data.get('country', 'India')
        state = request.data.get('state', '')
        
        # Find applicable tax rule
        rules = self.queryset.all()
        applicable_rule = None
        
        for rule in rules:
            if rule.country and rule.country != country:
                continue
            if rule.state and rule.state != state:
                continue
            applicable_rule = rule
            break
        
        if applicable_rule:
            tax_amount = (subtotal * applicable_rule.percentage) / 100
            return Response({
                'tax_percentage': float(applicable_rule.percentage),
                'tax_amount': float(tax_amount),
                'tax_type': 'exclusive', # Default to exclusive as model doesn't specify
                'rule_name': applicable_rule.name
            })
        
        return Response({
            'tax_percentage': 0,
            'tax_amount': 0,
            'tax_type': 'inclusive',
            'rule_name': 'No tax applicable'
        })


class CheckoutSettingsViewSet(viewsets.ModelViewSet):
    """Checkout settings management."""
    queryset = CheckoutSettings.objects.all()
    serializer_class = CheckoutSettingsSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get current checkout settings."""
        settings = self.queryset.first()
        if settings:
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        return Response(
            {'error': 'Checkout settings not configured'},
            status=status.HTTP_404_NOT_FOUND
        )


class InvoiceSettingsViewSet(viewsets.ModelViewSet):
    """Invoice settings management."""
    queryset = InvoiceSettings.objects.all()
    serializer_class = InvoiceSettingsSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get current invoice settings."""
        settings = self.queryset.first()
        if settings:
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        return Response(
            {'error': 'Invoice settings not configured'},
            status=status.HTTP_404_NOT_FOUND
        )


class ReturnPolicyViewSet(viewsets.ModelViewSet):
    """Return policy management."""
    queryset = ReturnPolicy.objects.filter(is_active=True)
    serializer_class = ReturnPolicySerializer
    permission_classes = [AllowAny]





class ProductComparisonViewSet(viewsets.ModelViewSet):
    """Product comparison management."""
    serializer_class = ProductComparisonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ProductComparison.objects.filter(
            user=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        """Add product to comparison."""
        comparison = self.get_object()
        product_id = request.data.get('product_id')
        
        from apps.products.models import Product
        try:
            product = Product.objects.get(id=product_id)
            comparison.products.add(product)
            serializer = self.get_serializer(comparison)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_product(self, request, pk=None):
        """Remove product from comparison."""
        comparison = self.get_object()
        product_id = request.data.get('product_id')
        
        from apps.products.models import Product
        try:
            product = Product.objects.get(id=product_id)
            comparison.products.remove(product)
            serializer = self.get_serializer(comparison)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

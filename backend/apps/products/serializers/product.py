"""
Product serializers.
"""
from rest_framework import serializers
from apps.products.models import Product, ProductVariant, ProductImage
from apps.products.serializers.category import CategoryListSerializer


class ProductVariantSerializer(serializers.ModelSerializer):
    """Product variant serializer."""
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'sku', 'barcode', 'attributes',
            'price', 'compare_at_price', 'cost_price',
            'weight', 'dimensions', 'image', 'position',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    """Full product serializer."""
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    variants = ProductVariantSerializer(many=True, read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    primary_image = serializers.JSONField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'category', 'category_id',
            'name', 'slug', 'sku', 'barcode',
            'short_description', 'description', 'highlights', 'specifications',
            'base_price', 'selling_price', 'cost_price', 'compare_at_price',
            'discount_percentage',
            'tax_class', 'tax_percentage', 'hsn_code',
            'weight', 'dimensions',
            'track_inventory', 'allow_backorder', 'low_stock_threshold',
            'images', 'videos', 'primary_image',
            'meta_title', 'meta_description', 'meta_keywords',
            'status', 'is_featured', 'published_at',
            'view_count', 'order_count', 'rating', 'review_count',
            'variants',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'vendor', 'view_count', 'order_count',
            'rating', 'review_count', 'created_at', 'updated_at'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Minimal product serializer for lists."""
    category = CategoryListSerializer(read_only=True)
    primary_image = serializers.JSONField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku',
            'category', 'primary_image',
            'selling_price', 'compare_at_price', 'discount_percentage',
            'rating', 'review_count', 'status', 'is_featured'
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products."""
    
    class Meta:
        model = Product
        fields = [
            'category', 'name', 'slug', 'sku', 'barcode',
            'short_description', 'description', 'highlights', 'specifications',
            'base_price', 'selling_price', 'cost_price', 'compare_at_price',
            'tax_class', 'tax_percentage', 'hsn_code',
            'weight', 'dimensions',
            'track_inventory', 'allow_backorder', 'low_stock_threshold',
            'images', 'videos',
            'meta_title', 'meta_description', 'meta_keywords',
            'status', 'is_featured'
        ]


class ProductUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating products."""
    
    class Meta:
        model = Product
        fields = [
            'category', 'name', 'short_description', 'description',
            'highlights', 'specifications',
            'base_price', 'selling_price', 'cost_price', 'compare_at_price',
            'tax_class', 'tax_percentage', 'hsn_code',
            'weight', 'dimensions',
            'track_inventory', 'allow_backorder', 'low_stock_threshold',
            'images', 'videos',
            'meta_title', 'meta_description', 'meta_keywords',
            'status', 'is_featured', 'is_active'
        ]

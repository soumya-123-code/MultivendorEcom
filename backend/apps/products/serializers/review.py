"""
Review serializers.
"""
from rest_framework import serializers
from apps.products.models import ProductReview


class ReviewSerializer(serializers.ModelSerializer):
    """Product review serializer."""
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'customer', 'customer_name', 'order',
            'rating', 'title', 'review', 'images',
            'is_verified_purchase', 'is_approved', 'is_featured',
            'helpful_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer', 'is_verified_purchase', 'is_approved',
            'helpful_count', 'created_at', 'updated_at'
        ]
    
    def get_customer_name(self, obj):
        if obj.customer and obj.customer.user:
            return obj.customer.user.get_full_name() or 'Anonymous'
        return 'Anonymous'


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews."""
    
    class Meta:
        model = ProductReview
        fields = ['product', 'order', 'rating', 'title', 'review', 'images']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ReviewListSerializer(serializers.ModelSerializer):
    """Minimal review serializer for lists."""
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'customer_name', 'rating', 'title',
            'is_verified_purchase', 'helpful_count', 'created_at'
        ]
    
    def get_customer_name(self, obj):
        if obj.customer and obj.customer.user:
            name = obj.customer.user.get_full_name()
            if name:
                # Show only first name and initial of last name
                parts = name.split()
                if len(parts) > 1:
                    return f"{parts[0]} {parts[1][0]}."
                return parts[0]
        return 'Anonymous'

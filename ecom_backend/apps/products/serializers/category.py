"""
Category serializers.
"""
from rest_framework import serializers
from apps.products.models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Full category serializer."""
    children = serializers.SerializerMethodField()
    full_path = serializers.CharField(read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'parent', 'level', 'path', 'full_path',
            'display_order', 'is_featured',
            'meta_title', 'meta_description', 'meta_keywords',
            'vendor', 'is_active', 'children',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'level', 'path', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategoryListSerializer(children, many=True).data


class CategoryListSerializer(serializers.ModelSerializer):
    """Minimal category serializer for lists."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'level', 'parent']


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Category serializer with nested children."""
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'level', 'children']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('display_order')
        return CategoryTreeSerializer(children, many=True).data


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating categories."""
    
    class Meta:
        model = Category
        fields = [
            'name', 'slug', 'description', 'image', 'parent',
            'display_order', 'is_featured',
            'meta_title', 'meta_description', 'meta_keywords'
        ]

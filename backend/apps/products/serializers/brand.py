"""
Brand serializers.
"""
from rest_framework import serializers
from apps.products.models import Brand


class BrandSerializer(serializers.ModelSerializer):
    """Full brand serializer."""

    class Meta:
        model = Brand
        fields = [
            'id', 'name', 'slug', 'logo', 'banner',
            'description', 'short_description', 'website',
            'is_active', 'is_featured', 'is_verified',
            'meta_title', 'meta_description', 'meta_keywords',
            'display_order', 'product_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'product_count', 'created_at', 'updated_at']


class BrandListSerializer(serializers.ModelSerializer):
    """Minimal brand serializer for lists."""

    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'is_featured', 'product_count']


class BrandCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating brands."""

    class Meta:
        model = Brand
        fields = [
            'name', 'logo', 'banner',
            'description', 'short_description', 'website',
            'is_active', 'is_featured',
            'meta_title', 'meta_description', 'meta_keywords',
            'display_order',
        ]

    def create(self, validated_data):
        from django.utils.text import slugify
        name = validated_data.get('name')
        validated_data['slug'] = slugify(name)
        return super().create(validated_data)

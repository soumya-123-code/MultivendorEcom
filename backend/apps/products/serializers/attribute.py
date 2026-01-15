"""
CategoryAttribute serializers.
"""
from rest_framework import serializers
from apps.products.models import CategoryAttribute, ProductAttributeValue


class CategoryAttributeSerializer(serializers.ModelSerializer):
    """Base serializer for CategoryAttribute."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = CategoryAttribute
        fields = [
            'id', 'category', 'category_name',
            'name', 'code', 'attribute_type',
            'options', 'range_min', 'range_max', 'range_step', 'range_unit',
            'is_filterable', 'is_searchable', 'is_required', 'is_variant_attribute',
            'position', 'help_text', 'placeholder',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategoryAttributeListSerializer(CategoryAttributeSerializer):
    """List serializer for CategoryAttribute."""

    class Meta(CategoryAttributeSerializer.Meta):
        fields = [
            'id', 'category', 'category_name',
            'name', 'code', 'attribute_type',
            'is_filterable', 'is_variant_attribute',
            'position',
        ]


class CategoryAttributeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating category attributes."""

    class Meta:
        model = CategoryAttribute
        fields = [
            'category', 'name', 'code', 'attribute_type',
            'options', 'range_min', 'range_max', 'range_step', 'range_unit',
            'is_filterable', 'is_searchable', 'is_required', 'is_variant_attribute',
            'position', 'help_text', 'placeholder',
        ]


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    """Serializer for product attribute values."""
    attribute_name = serializers.CharField(source='attribute.name', read_only=True)
    attribute_code = serializers.CharField(source='attribute.code', read_only=True)
    attribute_type = serializers.CharField(source='attribute.attribute_type', read_only=True)
    display_value = serializers.CharField(source='get_display_value', read_only=True)
    value = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttributeValue
        fields = [
            'id', 'product', 'attribute',
            'attribute_name', 'attribute_code', 'attribute_type',
            'value_text', 'value_number', 'value_boolean', 'value_json',
            'display_value', 'value',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_value(self, obj):
        return obj.value


class ProductAttributeValueCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating product attribute values."""

    class Meta:
        model = ProductAttributeValue
        fields = [
            'product', 'attribute',
            'value_text', 'value_number', 'value_boolean', 'value_json',
        ]

    def validate(self, attrs):
        attribute = attrs.get('attribute')
        if attribute:
            attr_type = attribute.attribute_type
            # Validate that appropriate value field is provided
            if attr_type == 'boolean' and attrs.get('value_boolean') is None:
                raise serializers.ValidationError({'value_boolean': 'Required for boolean attributes'})
            elif attr_type in ['text', 'select', 'color', 'size'] and not attrs.get('value_text'):
                raise serializers.ValidationError({'value_text': 'Required for this attribute type'})
            elif attr_type == 'multiselect' and not attrs.get('value_json'):
                raise serializers.ValidationError({'value_json': 'Required for multiselect attributes'})
            elif attr_type == 'range' and attrs.get('value_number') is None:
                raise serializers.ValidationError({'value_number': 'Required for range attributes'})
        return attrs

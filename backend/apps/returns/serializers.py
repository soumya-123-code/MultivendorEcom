from rest_framework import serializers
from .models import ReturnRequest, ReturnItem

class ReturnItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnItem
        fields = '__all__'
        read_only_fields = ('return_request',)

class ReturnRequestSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = ReturnRequest
        fields = '__all__'
        read_only_fields = ('status', 'refund_amount', 'admin_notes', 'created_at', 'updated_at', 'customer')

class CreateReturnSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)
    
    class Meta:
        model = ReturnRequest
        fields = ('order', 'reason', 'description', 'items')
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        return_request = ReturnRequest.objects.create(**validated_data)
        
        for item in items_data:
            ReturnItem.objects.create(return_request=return_request, **item)
            
        return return_request

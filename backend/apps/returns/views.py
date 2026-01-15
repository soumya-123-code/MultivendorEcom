from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ReturnRequest
from .serializers import ReturnRequestSerializer, CreateReturnSerializer

class ReturnRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing return requests."""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return ReturnRequest.objects.all()
        return ReturnRequest.objects.filter(customer=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateReturnSerializer
        return ReturnRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

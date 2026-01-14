"""
Notification models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel


class Notification(BaseModel):
    """User notification model."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    TYPE_CHOICES = [
        ('order', 'Order'),
        ('payment', 'Payment'),
        ('delivery', 'Delivery'),
        ('system', 'System'),
        ('promo', 'Promotional'),
    ]
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    data = models.JSONField(blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'notification'
        verbose_name_plural = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])


class NotificationTemplate(BaseModel):
    """Notification template for dynamic notifications."""
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50)
    
    title_template = models.CharField(max_length=255)
    message_template = models.TextField()
    
    class Meta:
        verbose_name = 'notification template'
        verbose_name_plural = 'notification templates'
    
    def __str__(self):
        return self.name

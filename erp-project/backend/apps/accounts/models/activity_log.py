"""
Activity Log model for audit trail.
"""
from django.db import models
from django.conf import settings


class ActivityLog(models.Model):
    """
    Model to track user activities for audit purposes.
    """
    ACTION_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    
    action = models.CharField(max_length=100)
    action_type = models.CharField(
        max_length=20,
        choices=ACTION_TYPES,
        default='other'
    )
    
    # Entity being acted upon
    entity_type = models.CharField(max_length=50, blank=True, null=True)
    entity_id = models.PositiveIntegerField(blank=True, null=True)
    
    # Request information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    # Additional data
    extra_data = models.JSONField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        verbose_name = 'activity log'
        verbose_name_plural = 'activity logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else 'Anonymous'
        return f"{user_str} - {self.action} at {self.created_at}"
    
    @classmethod
    def log(cls, action, action_type='other', user=None, entity_type=None,
            entity_id=None, ip_address=None, user_agent=None, extra_data=None):
        """Helper method to create activity log entries."""
        return cls.objects.create(
            user=user,
            action=action,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            user_agent=user_agent,
            extra_data=extra_data
        )

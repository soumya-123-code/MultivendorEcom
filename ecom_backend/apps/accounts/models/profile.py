"""
User Profile model for extended user information.
"""
from django.db import models
from django.conf import settings
from core.utils.choices import GenderChoices


class UserProfile(models.Model):
    """
    Extended user profile information.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=GenderChoices.CHOICES,
        blank=True,
        null=True
    )
    bio = models.TextField(blank=True, null=True)
    
    # Social links
    social_links = models.JSONField(
        blank=True,
        null=True,
        help_text='JSON object with social media links'
    )
    
    # User preferences
    preferences = models.JSONField(
        blank=True,
        null=True,
        help_text='JSON object for user preferences'
    )
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'user profile'
        verbose_name_plural = 'user profiles'
    
    def __str__(self):
        return f"Profile of {self.user.email}"

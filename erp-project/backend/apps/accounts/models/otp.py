"""
OTP Request model for passwordless authentication.
"""
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.conf import settings


class OTPRequestManager(models.Manager):
    """Custom manager for OTP requests."""
    
    def create_otp(self, email, otp_hash, ip_address=None, user_agent=None):
        """Create a new OTP request."""
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 5)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        return self.create(
            email=email.lower(),
            otp_hash=otp_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def get_valid_otp(self, email):
        """Get the latest valid (unused, not expired) OTP for an email."""
        return self.filter(
            email=email.lower(),
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()
    
    def invalidate_previous_otps(self, email):
        """Mark all previous OTPs for an email as used."""
        self.filter(
            email=email.lower(),
            is_used=False
        ).update(is_used=True)
    
    def cleanup_expired(self):
        """Delete expired OTP records."""
        self.filter(expires_at__lt=timezone.now()).delete()


class OTPRequest(models.Model):
    """
    Model to store OTP requests for email verification.
    """
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(
        max_length=128,
        help_text='SHA-256 hashed OTP'
    )
    
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    # Rate limiting
    attempts = models.PositiveIntegerField(default=0)
    
    # Tracking
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = OTPRequestManager()
    
    class Meta:
        verbose_name = 'OTP request'
        verbose_name_plural = 'OTP requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_used', 'expires_at']),
        ]
    
    def __str__(self):
        return f"OTP for {self.email} at {self.created_at}"
    
    @property
    def is_expired(self):
        """Check if the OTP has expired."""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if the OTP is still valid."""
        return not self.is_used and not self.is_expired
    
    def mark_used(self):
        """Mark the OTP as used."""
        self.is_used = True
        self.save(update_fields=['is_used'])
    
    def increment_attempts(self):
        """Increment the number of verification attempts."""
        self.attempts += 1
        self.save(update_fields=['attempts'])
    
    def has_exceeded_attempts(self, max_attempts=None):
        """Check if maximum attempts have been exceeded."""
        if max_attempts is None:
            max_attempts = getattr(settings, 'OTP_MAX_ATTEMPTS', 3)
        return self.attempts >= max_attempts

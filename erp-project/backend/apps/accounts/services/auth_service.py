"""
Authentication service for OTP generation and verification.
"""
import logging
from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, OTPRequest, ActivityLog
from core.utils.helpers import generate_otp, hash_otp, verify_otp_hash
from core.utils.choices import RoleChoices
from core.exceptions import (
    ValidationException, 
    AuthenticationError, 
    RateLimitError
)
from .email_service import EmailService

logger = logging.getLogger(__name__)


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    def request_otp(email: str, ip_address: str = None, user_agent: str = None) -> dict:
        """
        Generate and send OTP to the given email.
        
        Args:
            email: User's email address
            ip_address: Client IP address for rate limiting
            user_agent: Client user agent
        
        Returns:
            dict with success message and OTP (in development mode)
        """
        email = email.lower().strip()
        
        # Check rate limiting (max 5 OTP requests per email per hour)
        recent_requests = OTPRequest.objects.filter(
            email=email,
            created_at__gte=timezone.now() - timezone.timedelta(hours=1)
        ).count()
        
        if recent_requests >= 30:
            raise RateLimitError("Too many OTP requests. Please try again later.")
        
        # Invalidate any existing OTPs for this email
        OTPRequest.objects.invalidate_previous_otps(email)
        
        # Generate new OTP
        otp_length = getattr(settings, 'OTP_LENGTH', 6)
        otp = generate_otp(otp_length)
        otp_hash_value = hash_otp(otp, email)
        
        # Create OTP request record
        otp_request = OTPRequest.objects.create_otp(
            email=email,
            otp_hash=otp_hash_value,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Send OTP via email (mocked in development)
        EmailService.send_otp_email(email, otp)
        
        logger.info(f"OTP generated for {email}")
        
        # Calculate expiry time
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 5)
        expires_in_seconds = expiry_minutes * 60
        
        response = {
            'message': 'OTP sent successfully',
            'email': email,
            'expires_in': expires_in_seconds
        }
        
        # Include OTP in response for development
        if getattr(settings, 'SHOW_OTP_IN_RESPONSE', False):
            response['otp'] = otp
        
        return response
    
    @staticmethod
    def verify_otp(email: str, otp: str, ip_address: str = None) -> dict:
        """
        Verify OTP and return JWT tokens.
        
        Args:
            email: User's email address
            otp: The OTP to verify
            ip_address: Client IP address for logging
        
        Returns:
            dict with access token, refresh token, and user data
        """
        email = email.lower().strip()
        
        # Get valid OTP record
        otp_request = OTPRequest.objects.get_valid_otp(email)
        
        if not otp_request:
            raise AuthenticationError("Invalid or expired OTP.")
        
        # Check max attempts
        if otp_request.has_exceeded_attempts():
            otp_request.mark_used()
            raise AuthenticationError("Maximum verification attempts exceeded.")
        
        # Verify OTP hash
        if not verify_otp_hash(otp, otp_request.otp_hash, email):
            otp_request.increment_attempts()
            remaining = getattr(settings, 'OTP_MAX_ATTEMPTS', 3) - otp_request.attempts
            raise AuthenticationError(
                f"Invalid OTP. {remaining} attempts remaining."
            )
        
        # Mark OTP as used
        otp_request.mark_used()
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'role': RoleChoices.CUSTOMER, 'is_verified': True}
        )
        
        # Update user on login
        if not created:
            user.is_verified = True
            user.last_login = timezone.now()
            user.last_login_ip = ip_address
            user.save(update_fields=['is_verified', 'last_login', 'last_login_ip'])
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims
        refresh['email'] = user.email
        refresh['role'] = user.role
        
        # Get vendor_id if user is a vendor
        if user.role == RoleChoices.VENDOR and hasattr(user, 'vendor'):
            refresh['vendor_id'] = user.vendor.id
        
        # Log the login activity
        ActivityLog.log(
            action='User logged in',
            action_type='login',
            user=user,
            entity_type='user',
            entity_id=user.id,
            ip_address=ip_address
        )
        
        logger.info(f"User {email} logged in successfully")
        
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_verified': user.is_verified,
            }
        }
    
    @staticmethod
    def refresh_token(refresh_token: str) -> dict:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: The refresh token
        
        Returns:
            dict with new access token
        """
        try:
            refresh = RefreshToken(refresh_token)
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh)  # Rotated refresh token
            }
        except Exception as e:
            logger.warning(f"Token refresh failed: {str(e)}")
            raise AuthenticationError("Invalid or expired refresh token.")
    
    @staticmethod
    def logout(user, refresh_token: str = None) -> dict:
        """
        Logout user by blacklisting the refresh token.
        
        Args:
            user: The user to logout
            refresh_token: The refresh token to blacklist
        
        Returns:
            dict with success message
        """
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                logger.warning(f"Token blacklist failed: {str(e)}")
        
        # Log the logout activity
        ActivityLog.log(
            action='User logged out',
            action_type='logout',
            user=user,
            entity_type='user',
            entity_id=user.id if user else None
        )
        
        return {'message': 'Logged out successfully'}

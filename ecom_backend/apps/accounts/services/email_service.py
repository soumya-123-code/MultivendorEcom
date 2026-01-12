"""
Email service for sending emails (mocked in development).
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class EmailService:
    """Service class for sending emails."""
    
    @staticmethod
    def send_otp_email(email: str, otp: str) -> bool:
        """
        Send OTP email to user.
        
        In development mode, this just logs the OTP.
        In production, it sends an actual email.
        
        Args:
            email: Recipient email address
            otp: The OTP code
        
        Returns:
            bool: True if email sent successfully
        """
        subject = "Your Login OTP"
        
        # Try to render HTML template, fallback to plain text
        try:
            html_message = render_to_string('emails/otp.html', {
                'otp': otp,
                'expiry_minutes': getattr(settings, 'OTP_EXPIRY_MINUTES', 5)
            })
        except Exception:
            html_message = None
        
        plain_message = f"""
Your OTP for login is: {otp}

This OTP is valid for {getattr(settings, 'OTP_EXPIRY_MINUTES', 5)} minutes.

If you didn't request this OTP, please ignore this email.
        """
        
        try:
            # In development, this uses console backend
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False
            )
            logger.info(f"OTP email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send OTP email to {email}: {str(e)}")
            # In development, we don't want to fail if email sending fails
            if settings.DEBUG:
                logger.info(f"DEBUG MODE - OTP for {email}: {otp}")
                return True
            return False
    
    @staticmethod
    def send_welcome_email(user) -> bool:
        """Send welcome email to new user."""
        subject = "Welcome to Our Platform"
        plain_message = f"""
Hello {user.get_full_name() or user.email},

Welcome to our platform! We're excited to have you on board.

Best regards,
The Team
        """
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None,
                recipient_list=[user.email],
                fail_silently=True
            )
            logger.info(f"Welcome email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_order_confirmation(order) -> bool:
        """Send order confirmation email."""
        subject = f"Order Confirmation - {order.order_number}"
        plain_message = f"""
Your order {order.order_number} has been confirmed.

Order Total: {order.total_amount}

Thank you for your purchase!
        """
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None,
                recipient_list=[order.customer.user.email],
                fail_silently=True
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send order confirmation: {str(e)}")
            return False
    
    @staticmethod
    def send_status_update(order, old_status: str, new_status: str) -> bool:
        """Send order status update email."""
        subject = f"Order Status Update - {order.order_number}"
        plain_message = f"""
Your order {order.order_number} status has been updated.

Previous Status: {old_status}
New Status: {new_status}

Thank you for your patience!
        """
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None,
                recipient_list=[order.customer.user.email],
                fail_silently=True
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send status update: {str(e)}")
            return False

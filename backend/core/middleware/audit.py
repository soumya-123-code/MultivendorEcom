"""
Audit middleware for logging user activities.
"""
import logging
import threading

logger = logging.getLogger(__name__)

# Thread local storage for request context
_thread_locals = threading.local()


def get_current_request():
    """Get the current request from thread local storage."""
    return getattr(_thread_locals, 'request', None)


def get_current_user():
    """Get the current user from the request."""
    request = get_current_request()
    if request and hasattr(request, 'user'):
        return request.user if request.user.is_authenticated else None
    return None


def get_client_ip(request):
    """Extract client IP from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class AuditMiddleware:
    """
    Middleware to store request in thread local storage for audit logging.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store request in thread local
        _thread_locals.request = request
        
        # Process request
        response = self.get_response(request)
        
        # Log the request if needed
        self._log_request(request, response)
        
        # Clean up
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
        
        return response

    def _log_request(self, request, response):
        """Log significant requests for audit trail."""
        # Only log mutating requests
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            
            # Log to file/console
            logger.info(
                f"AUDIT: {request.method} {request.path} | "
                f"User: {user.email if user else 'Anonymous'} | "
                f"IP: {get_client_ip(request)} | "
                f"Status: {response.status_code}"
            )

"""
Custom exception handler for DRF.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    Throttled,
)
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.db import IntegrityError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all errors consistently.
    
    Response format:
    {
        "success": false,
        "error": {
            "code": "error_code",
            "message": "Human readable message",
            "details": {} or []  # Optional additional details
        }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Handle cases not covered by DRF's default handler
    if response is None:
        if isinstance(exc, Http404) or isinstance(exc, ObjectDoesNotExist):
            return _format_error_response(
                status_code=404,
                code='not_found',
                message=str(exc) or 'Resource not found.',
            )
        elif isinstance(exc, IntegrityError):
            logger.error(f"Database integrity error: {exc}")
            return _format_error_response(
                status_code=400,
                code='integrity_error',
                message='A database constraint was violated.',
            )
        else:
            # Log unexpected errors
            logger.exception(f"Unexpected error: {exc}")
            return _format_error_response(
                status_code=500,
                code='internal_error',
                message='An unexpected error occurred.',
            )
    
    # Format the response
    error_code = getattr(exc, 'default_code', 'error')
    
    if isinstance(exc, ValidationError):
        return _format_error_response(
            status_code=response.status_code,
            code='validation_error',
            message='Validation error.',
            details=response.data,
        )
    elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return _format_error_response(
            status_code=response.status_code,
            code='authentication_error',
            message=str(exc.detail) if hasattr(exc, 'detail') else 'Authentication failed.',
        )
    elif isinstance(exc, PermissionDenied):
        return _format_error_response(
            status_code=response.status_code,
            code='permission_denied',
            message=str(exc.detail) if hasattr(exc, 'detail') else 'Permission denied.',
        )
    elif isinstance(exc, NotFound):
        return _format_error_response(
            status_code=response.status_code,
            code='not_found',
            message=str(exc.detail) if hasattr(exc, 'detail') else 'Not found.',
        )
    elif isinstance(exc, Throttled):
        return _format_error_response(
            status_code=response.status_code,
            code='rate_limit_exceeded',
            message=f'Too many requests. Try again in {exc.wait} seconds.',
            details={'retry_after': exc.wait},
        )
    
    # Generic error formatting
    message = str(exc.detail) if hasattr(exc, 'detail') else str(exc)
    if isinstance(message, dict):
        message = 'An error occurred.'
        details = exc.detail
    else:
        details = None
    
    return _format_error_response(
        status_code=response.status_code,
        code=error_code,
        message=message,
        details=details,
    )


def _format_error_response(status_code, code, message, details=None):
    """Helper to format error response consistently."""
    from rest_framework.response import Response
    
    error_data = {
        'success': False,
        'error': {
            'code': code,
            'message': message,
        }
    }
    
    if details:
        error_data['error']['details'] = details
    
    return Response(error_data, status=status_code)

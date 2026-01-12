"""
Custom exceptions for the API.
"""
from rest_framework import status
from rest_framework.exceptions import APIException


class BaseAPIException(APIException):
    """Base exception for all custom API exceptions."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred.'
    default_code = 'error'


class ValidationException(BaseAPIException):
    """Exception for validation errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation error.'
    default_code = 'validation_error'


class NotFoundError(BaseAPIException):
    """Exception for not found errors."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class PermissionDeniedError(BaseAPIException):
    """Exception for permission denied errors."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'


class AuthenticationError(BaseAPIException):
    """Exception for authentication errors."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication failed.'
    default_code = 'authentication_error'


class BusinessLogicError(BaseAPIException):
    """Exception for business logic errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Business logic error.'
    default_code = 'business_logic_error'


class ConflictError(BaseAPIException):
    """Exception for conflict errors (e.g., duplicate entries)."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource already exists.'
    default_code = 'conflict'


class RateLimitError(BaseAPIException):
    """Exception for rate limit errors."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Too many requests. Please try again later.'
    default_code = 'rate_limit_exceeded'


class StateTransitionError(BusinessLogicError):
    """Exception for invalid state transitions."""
    default_detail = 'Invalid state transition.'
    default_code = 'invalid_state_transition'


class InsufficientStockError(BusinessLogicError):
    """Exception for insufficient stock errors."""
    default_detail = 'Insufficient stock available.'
    default_code = 'insufficient_stock'


class PaymentError(BusinessLogicError):
    """Exception for payment errors."""
    default_detail = 'Payment processing failed.'
    default_code = 'payment_error'

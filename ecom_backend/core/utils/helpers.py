"""
Helper utilities for the application.
"""
import hashlib
import random
import string
import uuid
from datetime import datetime
from django.utils.text import slugify


def generate_unique_code(prefix='', length=8):
    """
    Generate a unique code with optional prefix.
    """
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(chars, k=length))
    if prefix:
        return f"{prefix}-{code}"
    return code


def generate_otp(length=6):
    """
    Generate a numeric OTP of specified length.
    """
    return ''.join(random.choices(string.digits, k=length))


def hash_otp(otp, salt=''):
    """
    Hash an OTP using SHA-256.
    """
    data = f"{otp}{salt}"
    return hashlib.sha256(data.encode()).hexdigest()


def verify_otp_hash(otp, hashed_otp, salt=''):
    """
    Verify an OTP against its hash.
    """
    return hash_otp(otp, salt) == hashed_otp


def get_client_ip(request):
    """
    Extract client IP from request headers.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def generate_order_number(prefix='ORD'):
    """
    Generate a unique order number.
    Format: PREFIX-YYYYMMDD-XXXXXXXX
    """
    date_part = datetime.now().strftime('%Y%m%d')
    unique_part = uuid.uuid4().hex[:8].upper()
    return f"{prefix}-{date_part}-{unique_part}"


def generate_po_number():
    """Generate purchase order number."""
    return generate_order_number('PO')


def generate_so_number():
    """Generate sales order number."""
    return generate_order_number('SO')


def generate_shipment_number():
    """Generate shipment number."""
    return generate_order_number('SHP')


def generate_payment_number():
    """Generate payment number."""
    return generate_order_number('PAY')


def generate_refund_number():
    """Generate refund number."""
    return generate_order_number('REF')


def generate_inward_number():
    """Generate inward number."""
    return generate_order_number('INW')


def slugify_unique(value, model_class, slug_field='slug'):
    """
    Generate a unique slug for a model.
    """
    base_slug = slugify(value)
    slug = base_slug
    counter = 1
    
    while model_class.objects.filter(**{slug_field: slug}).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug


def format_currency(amount, currency='INR'):
    """
    Format amount as currency string.
    """
    if currency == 'INR':
        return f"₹{amount:,.2f}"
    elif currency == 'USD':
        return f"${amount:,.2f}"
    return f"{amount:,.2f} {currency}"


def calculate_percentage(part, whole):
    """
    Calculate percentage safely.
    """
    if whole == 0:
        return 0
    return (part / whole) * 100


def truncate_string(text, max_length=100, suffix='...'):
    """
    Truncate a string to max_length with suffix.
    """
    if not text or len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

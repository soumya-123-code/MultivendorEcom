"""
Reusable choice definitions.
"""


class RoleChoices:
    """User role choices."""
    SUPER_ADMIN = 'super_admin'
    ADMIN = 'admin'
    STAFF = 'staff'
    VENDOR = 'vendor'
    CUSTOMER = 'customer'
    DELIVERY_AGENT = 'delivery_agent'
    
    CHOICES = [
        (SUPER_ADMIN, 'Super Admin'),
        (ADMIN, 'Admin'),
        (STAFF, 'Staff'),
        (VENDOR, 'Vendor'),
        (CUSTOMER, 'Customer'),
        (DELIVERY_AGENT, 'Delivery Agent'),
    ]


class StatusChoices:
    """Generic status choices."""
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    PENDING = 'pending'
    
    CHOICES = [
        (ACTIVE, 'Active'),
        (INACTIVE, 'Inactive'),
        (PENDING, 'Pending'),
    ]


class GenderChoices:
    """Gender choices."""
    MALE = 'male'
    FEMALE = 'female'
    OTHER = 'other'
    PREFER_NOT_TO_SAY = 'prefer_not_to_say'
    
    CHOICES = [
        (MALE, 'Male'),
        (FEMALE, 'Female'),
        (OTHER, 'Other'),
        (PREFER_NOT_TO_SAY, 'Prefer not to say'),
    ]


class AddressTypeChoices:
    """Address type choices."""
    SHIPPING = 'shipping'
    BILLING = 'billing'
    BOTH = 'both'
    
    CHOICES = [
        (SHIPPING, 'Shipping'),
        (BILLING, 'Billing'),
        (BOTH, 'Both'),
    ]


class PaymentMethodChoices:
    """Payment method choices."""
    CARD = 'card'
    UPI = 'upi'
    NETBANKING = 'netbanking'
    COD = 'cod'
    WALLET = 'wallet'
    
    CHOICES = [
        (CARD, 'Card'),
        (UPI, 'UPI'),
        (NETBANKING, 'Net Banking'),
        (COD, 'Cash on Delivery'),
        (WALLET, 'Wallet'),
    ]


class DiscountTypeChoices:
    """Discount type choices."""
    NONE = 'none'
    PERCENTAGE = 'percentage'
    AMOUNT = 'amount'
    ITEM_LEVEL = 'item_level'
    
    CHOICES = [
        (NONE, 'None'),
        (PERCENTAGE, 'Percentage'),
        (AMOUNT, 'Fixed Amount'),
        (ITEM_LEVEL, 'Item Level'),
    ]


class BusinessTypeChoices:
    """Business type choices."""
    INDIVIDUAL = 'individual'
    COMPANY = 'company'
    PARTNERSHIP = 'partnership'
    
    CHOICES = [
        (INDIVIDUAL, 'Individual'),
        (COMPANY, 'Company'),
        (PARTNERSHIP, 'Partnership'),
    ]


class WarehouseTypeChoices:
    """Warehouse type choices."""
    OWNED = 'owned'
    LEASED = 'leased'
    THIRD_PARTY = 'third_party'
    
    CHOICES = [
        (OWNED, 'Owned'),
        (LEASED, 'Leased'),
        (THIRD_PARTY, 'Third Party'),
    ]


class VehicleTypeChoices:
    """Vehicle type choices for delivery agents."""
    BIKE = 'bike'
    SCOOTER = 'scooter'
    BICYCLE = 'bicycle'
    VAN = 'van'
    CAR = 'car'
    
    CHOICES = [
        (BIKE, 'Bike'),
        (SCOOTER, 'Scooter'),
        (BICYCLE, 'Bicycle'),
        (VAN, 'Van'),
        (CAR, 'Car'),
    ]


class IDTypeChoices:
    """ID document type choices."""
    AADHAAR = 'aadhaar'
    PAN = 'pan'
    DRIVING_LICENSE = 'driving_license'
    PASSPORT = 'passport'
    VOTER_ID = 'voter_id'
    
    CHOICES = [
        (AADHAAR, 'Aadhaar'),
        (PAN, 'PAN'),
        (DRIVING_LICENSE, 'Driving License'),
        (PASSPORT, 'Passport'),
        (VOTER_ID, 'Voter ID'),
    ]


class OrderSourceChoices:
    """Order source choices."""
    WEB = 'web'
    MOBILE = 'mobile'
    ADMIN = 'admin'
    API = 'api'
    POS = 'pos'
    
    CHOICES = [
        (WEB, 'Web'),
        (MOBILE, 'Mobile'),
        (ADMIN, 'Admin'),
        (API, 'API'),
        (POS, 'POS'),
    ]

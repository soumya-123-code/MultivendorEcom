"""
Role-Based Access Control (RBAC) permissions for the system.
"""
from rest_framework.permissions import BasePermission


class RoleChoices:
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
    
    # Role hierarchy - higher roles include permissions of lower roles
    ADMIN_ROLES = [SUPER_ADMIN, ADMIN]
    STAFF_ROLES = [SUPER_ADMIN, ADMIN, STAFF]
    VENDOR_ROLES = [VENDOR]
    ALL_INTERNAL_ROLES = [SUPER_ADMIN, ADMIN, STAFF, VENDOR]


class RBACPermission(BasePermission):
    """
    Base RBAC permission class that checks user role against allowed roles.
    """
    allowed_roles = []
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super admin has access to everything
        if request.user.role == RoleChoices.SUPER_ADMIN:
            return True
        
        return request.user.role in self.allowed_roles
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsSuperAdmin(BasePermission):
    """
    Allows access only to super admin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.SUPER_ADMIN
        )


class IsAdmin(BasePermission):
    """
    Allows access to admin users (super_admin, admin).
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in RoleChoices.ADMIN_ROLES
        )


class IsStaff(BasePermission):
    """
    Allows access to staff users (super_admin, admin, staff).
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in RoleChoices.STAFF_ROLES
        )


class IsVendor(BasePermission):
    """
    Allows access only to vendor users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.VENDOR
        )


class IsCustomer(BasePermission):
    """
    Allows access only to customer users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.CUSTOMER
        )


class IsDeliveryAgent(BasePermission):
    """
    Allows access only to delivery agent users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.DELIVERY_AGENT
        )


class IsVendorOrAdmin(BasePermission):
    """
    Allows access to vendors and admin users.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.role in (
            RoleChoices.SUPER_ADMIN,
            RoleChoices.ADMIN,
            RoleChoices.VENDOR
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to access it.
    Assumes the model instance has a `user` attribute or a method `get_owner()`.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can access everything
        if request.user.role in RoleChoices.ADMIN_ROLES:
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        elif hasattr(obj, 'get_owner'):
            return obj.get_owner() == request.user
        
        return False


class IsVendorOwner(BasePermission):
    """
    Object-level permission for vendor-owned resources.
    Assumes the model instance has a `vendor` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can access everything
        if request.user.role in RoleChoices.ADMIN_ROLES:
            return True
        
        # Check if user is the vendor owner
        if request.user.role == RoleChoices.VENDOR:
            if hasattr(obj, 'vendor'):
                if hasattr(request.user, 'vendor'):
                    return obj.vendor == request.user.vendor
                return obj.vendor.user_id == request.user.id
            elif hasattr(obj, 'vendor_id'):
                if hasattr(request.user, 'vendor'):
                    return obj.vendor_id == request.user.vendor.id
        
        return False


class VendorDataPermission(BasePermission):
    """
    Permission class that filters queryset based on vendor.
    Use this for viewsets that need automatic vendor filtering.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can access all data
        if request.user.role in RoleChoices.ADMIN_ROLES:
            return True
        
        # Vendors can only access their own data
        if request.user.role == RoleChoices.VENDOR:
            return hasattr(request.user, 'vendor')
        
        # Staff can access data based on their assigned vendor
        if request.user.role == RoleChoices.STAFF:
            return True  # Further filtering done at queryset level
        
        return False


def get_user_vendor(user):
    """
    Helper function to get the vendor associated with a user.
    Returns None if user is not a vendor or doesn't have a vendor profile.
    """
    if not user or not user.is_authenticated:
        return None
    
    if user.role == RoleChoices.VENDOR:
        return getattr(user, 'vendor', None)
    
    if user.role == RoleChoices.STAFF:
        # Staff might be assigned to a vendor
        staff = getattr(user, 'vendor_staff', None)
        if staff:
            return staff.vendor
    
    return None

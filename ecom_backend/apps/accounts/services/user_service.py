"""
User service for user management operations.
"""
import logging
from django.db import transaction
from apps.accounts.models import User, UserProfile
from core.utils.choices import RoleChoices
from core.exceptions import NotFoundError, PermissionDeniedError, ValidationException

logger = logging.getLogger(__name__)


class UserService:
    """Service class for user management operations."""
    
    @staticmethod
    def get_user_by_id(user_id: int) -> User:
        """Get user by ID."""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFoundError(f"User with ID {user_id} not found.")
    
    @staticmethod
    def get_user_by_email(email: str) -> User:
        """Get user by email."""
        try:
            return User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise NotFoundError(f"User with email {email} not found.")
    
    @staticmethod
    @transaction.atomic
    def create_user(
        email: str,
        role: str = RoleChoices.CUSTOMER,
        **kwargs
    ) -> User:
        """
        Create a new user.
        
        Args:
            email: User's email address
            role: User's role
            **kwargs: Additional user fields
        
        Returns:
            Created user instance
        """
        email = email.lower().strip()
        
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationException("User with this email already exists.")
        
        user = User.objects.create_user(email=email, role=role, **kwargs)
        
        # Create associated profile
        UserProfile.objects.create(user=user)
        
        logger.info(f"User created: {email} with role {role}")
        
        return user
    
    @staticmethod
    def update_user(user: User, **kwargs) -> User:
        """
        Update user fields.
        
        Args:
            user: User instance to update
            **kwargs: Fields to update
        
        Returns:
            Updated user instance
        """
        allowed_fields = [
            'phone', 'first_name', 'last_name', 'avatar',
            'language', 'timezone', 'currency', 'is_active'
        ]
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                setattr(user, field, value)
        
        user.save()
        logger.info(f"User updated: {user.email}")
        
        return user
    
    @staticmethod
    def update_profile(user: User, **kwargs) -> UserProfile:
        """
        Update user profile.
        
        Args:
            user: User instance
            **kwargs: Profile fields to update
        
        Returns:
            Updated profile instance
        """
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        for field, value in kwargs.items():
            if hasattr(profile, field):
                setattr(profile, field, value)
        
        profile.save()
        logger.info(f"Profile updated for: {user.email}")
        
        return profile
    
    @staticmethod
    def change_role(
        user: User,
        new_role: str,
        changed_by: User
    ) -> User:
        """
        Change user's role.
        
        Args:
            user: User whose role to change
            new_role: New role to assign
            changed_by: User making the change
        
        Returns:
            Updated user instance
        """
        # Super admin role can only be assigned by super admin
        if new_role == RoleChoices.SUPER_ADMIN:
            if changed_by.role != RoleChoices.SUPER_ADMIN:
                raise PermissionDeniedError(
                    "Only super admins can assign super admin role."
                )
        
        # Cannot demote yourself if you're the only super admin
        if user == changed_by and user.role == RoleChoices.SUPER_ADMIN:
            super_admin_count = User.objects.filter(
                role=RoleChoices.SUPER_ADMIN,
                is_active=True
            ).count()
            
            if super_admin_count <= 1:
                raise ValidationException(
                    "Cannot change role. You are the only super admin."
                )
        
        old_role = user.role
        user.role = new_role
        user.save(update_fields=['role'])
        
        logger.info(
            f"Role changed for {user.email}: {old_role} -> {new_role} "
            f"by {changed_by.email}"
        )
        
        return user
    
    @staticmethod
    def deactivate_user(user: User, deactivated_by: User) -> User:
        """Deactivate a user account."""
        if user == deactivated_by:
            raise ValidationException("You cannot deactivate your own account.")
        
        if user.role == RoleChoices.SUPER_ADMIN:
            if deactivated_by.role != RoleChoices.SUPER_ADMIN:
                raise PermissionDeniedError(
                    "Only super admins can deactivate super admin accounts."
                )
        
        user.is_active = False
        user.save(update_fields=['is_active'])
        
        logger.info(f"User deactivated: {user.email} by {deactivated_by.email}")
        
        return user
    
    @staticmethod
    def activate_user(user: User, activated_by: User) -> User:
        """Activate a user account."""
        user.is_active = True
        user.save(update_fields=['is_active'])
        
        logger.info(f"User activated: {user.email} by {activated_by.email}")
        
        return user
    
    @staticmethod
    def get_users_queryset(requesting_user: User):
        """
        Get users queryset based on requesting user's role.
        
        Args:
            requesting_user: User making the request
        
        Returns:
            Filtered queryset of users
        """
        queryset = User.objects.all()
        
        # Super admin sees all
        if requesting_user.role == RoleChoices.SUPER_ADMIN:
            return queryset
        
        # Admin sees everyone except super admins
        if requesting_user.role == RoleChoices.ADMIN:
            return queryset.exclude(role=RoleChoices.SUPER_ADMIN)
        
        # Staff sees only customers and delivery agents
        if requesting_user.role == RoleChoices.STAFF:
            return queryset.filter(
                role__in=[RoleChoices.CUSTOMER, RoleChoices.DELIVERY_AGENT]
            )
        
        # Vendor sees only their customers (handled at view level)
        if requesting_user.role == RoleChoices.VENDOR:
            return queryset.filter(role=RoleChoices.CUSTOMER)
        
        # Others see only themselves
        return queryset.filter(id=requesting_user.id)

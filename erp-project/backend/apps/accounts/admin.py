"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.accounts.models import User, UserProfile, OTPRequest, ActivityLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin for custom User model."""
    list_display = [
        'email', 'first_name', 'last_name', 'role',
        'is_active', 'is_verified', 'date_joined'
    ]
    list_filter = ['role', 'is_active', 'is_verified', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email',)}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        ('Role & Status', {'fields': ('role', 'is_active', 'is_verified')}),
        ('Preferences', {'fields': ('language', 'timezone', 'currency')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'role', 'is_active'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin for UserProfile model."""
    list_display = ['user', 'gender', 'date_of_birth', 'created_at']
    search_fields = ['user__email']
    raw_id_fields = ['user']


@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    """Admin for OTP requests."""
    list_display = ['email', 'is_used', 'attempts', 'expires_at', 'created_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['email']
    readonly_fields = ['otp_hash', 'created_at']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """Admin for activity logs."""
    list_display = ['user', 'action', 'action_type', 'entity_type', 'ip_address', 'created_at']
    list_filter = ['action_type', 'entity_type', 'created_at']
    search_fields = ['user__email', 'action']
    readonly_fields = ['created_at']
    raw_id_fields = ['user']

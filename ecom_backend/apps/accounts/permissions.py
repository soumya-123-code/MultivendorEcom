"""
Custom permissions for accounts app.
"""
from core.permissions import (
    RBACPermission,
    IsAdmin,
    IsSuperAdmin,
    IsOwnerOrAdmin,
)

__all__ = [
    'RBACPermission',
    'IsAdmin',
    'IsSuperAdmin',
    'IsOwnerOrAdmin',
]

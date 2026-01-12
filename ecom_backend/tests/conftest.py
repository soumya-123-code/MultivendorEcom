"""
Pytest configuration for the ERP E-commerce backend.
"""
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from core.utils.choices import RoleChoices


@pytest.fixture
def api_client():
    """Return an API client."""
    return APIClient()


@pytest.fixture
def create_user(db):
    """Factory fixture for creating users."""
    def _create_user(
        email='test@example.com',
        role=RoleChoices.CUSTOMER,
        **kwargs
    ):
        return User.objects.create_user(
            email=email,
            role=role,
            **kwargs
        )
    return _create_user


@pytest.fixture
def user(create_user):
    """Return a regular user."""
    return create_user()


@pytest.fixture
def admin_user(create_user):
    """Return an admin user."""
    return create_user(
        email='admin@example.com',
        role=RoleChoices.ADMIN,
        is_staff=True
    )


@pytest.fixture
def super_admin_user(create_user):
    """Return a super admin user."""
    return create_user(
        email='superadmin@example.com',
        role=RoleChoices.SUPER_ADMIN,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def vendor_user(create_user):
    """Return a vendor user."""
    return create_user(
        email='vendor@example.com',
        role=RoleChoices.VENDOR
    )


@pytest.fixture
def customer_user(create_user):
    """Return a customer user."""
    return create_user(
        email='customer@example.com',
        role=RoleChoices.CUSTOMER
    )


@pytest.fixture
def delivery_agent_user(create_user):
    """Return a delivery agent user."""
    return create_user(
        email='delivery@example.com',
        role=RoleChoices.DELIVERY_AGENT
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """Return an authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return an admin authenticated API client."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def vendor_client(api_client, vendor_user):
    """Return a vendor authenticated API client."""
    api_client.force_authenticate(user=vendor_user)
    return api_client

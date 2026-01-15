
import os
import django
from django.urls import resolve, reverse
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    path = '/api/v1/inventory/low-stock/'
    match = resolve(path)
    print(f"Successfully resolved {path}")
    print(f"View name: {match.view_name}")
    print(f"Func: {match.func}")
except Exception as e:
    print(f"Failed to resolve {path}: {e}")

print("-" * 20)

try:
    # List all patterns in inventory
    from apps.inventory.urls import router
    print("Inventory Router URLs:")
    for url in router.urls:
        print(url)
except Exception as e:
    print(f"Error inspecting inventory urls: {e}")

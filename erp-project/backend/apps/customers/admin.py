from django.contrib import admin
from apps.customers.models import Customer, CustomerAddress, Cart, CartItem, Wishlist


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['user', 'loyalty_points', 'total_spent', 'total_orders', 'created_at']
    search_fields = ['user__email']
    raw_id_fields = ['user']


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ['customer', 'label', 'address_type', 'city', 'is_default']
    list_filter = ['address_type', 'is_default']
    search_fields = ['customer__user__email', 'city']
    raw_id_fields = ['customer']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'total', 'created_at']
    raw_id_fields = ['customer']


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity', 'total_price']
    raw_id_fields = ['cart', 'product', 'variant']


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['customer', 'product', 'created_at']
    raw_id_fields = ['customer', 'product']

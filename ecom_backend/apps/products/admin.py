"""
Admin configuration for products app.
"""
from django.contrib import admin
from apps.products.models import Category, Product, ProductVariant, ProductImage, ProductReview


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'level', 'display_order', 'is_featured', 'is_active']
    list_filter = ['level', 'is_featured', 'is_active', 'vendor']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    raw_id_fields = ['parent', 'vendor']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'vendor', 'category', 'sku', 'selling_price',
        'status', 'rating', 'is_featured', 'is_active'
    ]
    list_filter = ['status', 'is_featured', 'is_active', 'category', 'vendor']
    search_fields = ['name', 'sku', 'description']
    prepopulated_fields = {'slug': ('name',)}
    raw_id_fields = ['vendor', 'category']
    readonly_fields = ['view_count', 'order_count', 'rating', 'review_count']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('vendor', 'category', 'name', 'slug', 'sku', 'barcode')
        }),
        ('Description', {
            'fields': ('short_description', 'description', 'highlights', 'specifications')
        }),
        ('Pricing', {
            'fields': ('base_price', 'selling_price', 'cost_price', 'compare_at_price')
        }),
        ('Tax', {
            'fields': ('tax_class', 'tax_percentage', 'hsn_code')
        }),
        ('Physical', {
            'fields': ('weight', 'dimensions')
        }),
        ('Inventory', {
            'fields': ('track_inventory', 'allow_backorder', 'low_stock_threshold')
        }),
        ('Media', {
            'fields': ('images', 'videos')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords')
        }),
        ('Status', {
            'fields': ('status', 'is_featured', 'is_active', 'published_at')
        }),
        ('Stats', {
            'fields': ('view_count', 'order_count', 'rating', 'review_count')
        }),
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['name', 'product', 'sku', 'price', 'is_active']
    list_filter = ['is_active', 'product__vendor']
    search_fields = ['name', 'sku', 'product__name']
    raw_id_fields = ['product']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'position', 'is_primary', 'is_active']
    list_filter = ['is_primary', 'is_active']
    raw_id_fields = ['product']


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'customer', 'rating', 'is_verified_purchase',
        'is_approved', 'is_featured', 'created_at'
    ]
    list_filter = ['rating', 'is_verified_purchase', 'is_approved', 'is_featured']
    search_fields = ['product__name', 'customer__user__email', 'title']
    raw_id_fields = ['product', 'customer', 'order', 'approved_by']

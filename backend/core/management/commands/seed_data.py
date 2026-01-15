"""
Management command to seed the database with dummy data.

Usage:
    python manage.py seed_data
    python manage.py seed_data --clear  # Clear existing data first
"""
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction


class Command(BaseCommand):
    help = 'Seed database with dummy data for all tables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Starting database seeding...')

        with transaction.atomic():
            # Create data in order of dependencies
            users = self.create_users()
            vendors = self.create_vendors(users)
            suppliers = self.create_suppliers(vendors)
            warehouses = self.create_warehouses(vendors)
            categories = self.create_categories(vendors)
            products = self.create_products(vendors, categories)
            customers = self.create_customers(users)
            self.create_customer_addresses(customers)
            self.create_inventory(products, warehouses)
            carts = self.create_carts(customers, products)
            self.create_wishlists(customers, products)
            purchase_orders = self.create_purchase_orders(vendors, suppliers, products, warehouses)
            sales_orders = self.create_sales_orders(customers, products, vendors)
            self.create_payments(sales_orders)
            delivery_agents = self.create_delivery_agents(users)
            self.create_delivery_assignments(sales_orders, delivery_agents)
            self.create_notifications(users)
            self.create_product_reviews(products, customers, sales_orders)

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

    def clear_data(self):
        """Clear all data from tables."""
        from apps.products.models import Product, Category, ProductVariant, ProductImage, ProductReview
        from apps.accounts.models import User, UserProfile, OTPRequest, ActivityLog
        from apps.vendors.models import Vendor, Supplier
        from apps.vendors.models.vendor import VendorStaff
        from apps.customers.models import Customer, CustomerAddress, Cart, CartItem, Wishlist
        from apps.inventory.models import Inventory, InventoryLog
        from apps.warehouses.models import Warehouse, RackShelfLocation
        from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem, POStatusLog
        from apps.sales_orders.models import SalesOrder, SalesOrderItem, SOStatusLog
        from apps.payments.models import Payment, Refund
        from apps.delivery_agents.models import DeliveryAgent, DeliveryAssignment, DeliveryProof, DeliveryStatusLog
        from apps.notifications.models import Notification, NotificationTemplate

        # Delete in reverse dependency order
        DeliveryStatusLog.objects.all().delete()
        DeliveryProof.objects.all().delete()
        DeliveryAssignment.objects.all().delete()
        DeliveryAgent.objects.all().delete()
        Refund.objects.all().delete()
        Payment.objects.all().delete()
        SOStatusLog.objects.all().delete()
        SalesOrderItem.objects.all().delete()
        SalesOrder.objects.all().delete()
        POStatusLog.objects.all().delete()
        PurchaseOrderItem.objects.all().delete()
        PurchaseOrder.objects.all().delete()
        InventoryLog.objects.all().delete()
        Inventory.objects.all().delete()
        RackShelfLocation.objects.all().delete()
        Warehouse.objects.all().delete()
        Wishlist.objects.all().delete()
        CartItem.objects.all().delete()
        Cart.objects.all().delete()
        CustomerAddress.objects.all().delete()
        Customer.objects.all().delete()
        ProductReview.objects.all().delete()
        ProductImage.objects.all().delete()
        ProductVariant.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        VendorStaff.objects.all().delete()
        Supplier.objects.all().delete()
        Vendor.objects.all().delete()
        Notification.objects.all().delete()
        NotificationTemplate.objects.all().delete()
        ActivityLog.objects.all().delete()
        OTPRequest.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write('All data cleared.')

    def create_users(self):
        """Create dummy users."""
        from apps.accounts.models import User

        self.stdout.write('Creating users...')
        users = []

        # Admin user
        admin, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'phone': '+919999999999',
                'role': 'admin',
                'is_active': True,
                'is_verified': True,
                'is_staff': True,
            }
        )
        users.append(admin)
        if created:
            self.stdout.write(f'  Created admin: {admin.email}')

        # Vendor users
        vendor_data = [
            {'email': 'vendor1@example.com', 'first_name': 'Rahul', 'last_name': 'Sharma', 'phone': '+919876543210'},
            {'email': 'vendor2@example.com', 'first_name': 'Priya', 'last_name': 'Patel', 'phone': '+919876543211'},
            {'email': 'vendor3@example.com', 'first_name': 'Amit', 'last_name': 'Kumar', 'phone': '+919876543212'},
        ]
        for data in vendor_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'role': 'vendor', 'is_active': True, 'is_verified': True}
            )
            users.append(user)
            if created:
                self.stdout.write(f'  Created vendor user: {user.email}')

        # Customer users
        customer_data = [
            {'email': 'customer1@example.com', 'first_name': 'Sanjay', 'last_name': 'Gupta', 'phone': '+919876543220'},
            {'email': 'customer2@example.com', 'first_name': 'Meera', 'last_name': 'Singh', 'phone': '+919876543221'},
            {'email': 'customer3@example.com', 'first_name': 'Vikram', 'last_name': 'Reddy', 'phone': '+919876543222'},
            {'email': 'customer4@example.com', 'first_name': 'Anjali', 'last_name': 'Nair', 'phone': '+919876543223'},
            {'email': 'customer5@example.com', 'first_name': 'Raj', 'last_name': 'Malhotra', 'phone': '+919876543224'},
        ]
        for data in customer_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'role': 'customer', 'is_active': True, 'is_verified': True}
            )
            users.append(user)
            if created:
                self.stdout.write(f'  Created customer user: {user.email}')

        # Delivery agent users
        delivery_data = [
            {'email': 'delivery1@example.com', 'first_name': 'Ravi', 'last_name': 'Kumar', 'phone': '+919876543230'},
            {'email': 'delivery2@example.com', 'first_name': 'Suresh', 'last_name': 'Yadav', 'phone': '+919876543231'},
        ]
        for data in delivery_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'role': 'delivery_agent', 'is_active': True, 'is_verified': True}
            )
            users.append(user)
            if created:
                self.stdout.write(f'  Created delivery user: {user.email}')

        return users

    def create_vendors(self, users):
        """Create vendor profiles."""
        from apps.vendors.models import Vendor

        self.stdout.write('Creating vendors...')
        vendors = []
        vendor_users = [u for u in users if u.role == 'vendor']

        vendor_info = [
            {
                'store_name': 'Tech Galaxy',
                'store_slug': 'tech-galaxy',
                'business_name': 'Tech Galaxy Pvt Ltd',
                'business_type': 'electronics',
                'description': 'Premium electronics and gadgets store',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
            },
            {
                'store_name': 'Fashion Hub',
                'store_slug': 'fashion-hub',
                'business_name': 'Fashion Hub Industries',
                'business_type': 'fashion',
                'description': 'Trendy fashion and accessories',
                'city': 'Delhi',
                'state': 'Delhi',
                'pincode': '110001',
            },
            {
                'store_name': 'Home Essentials',
                'store_slug': 'home-essentials',
                'business_name': 'Home Essentials Co',
                'business_type': 'home_decor',
                'description': 'Everything for your home',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560001',
            },
        ]

        for i, user in enumerate(vendor_users):
            info = vendor_info[i] if i < len(vendor_info) else vendor_info[0]
            vendor, created = Vendor.objects.get_or_create(
                user=user,
                defaults={
                    **info,
                    'tax_id': f'29ABCDE{1234+i}F1Z{i}',
                    'registration_number': f'ABCDE{1234+i}F',
                    'bank_name': 'HDFC Bank',
                    'bank_account_number': f'1234567890{i}',
                    'bank_ifsc': 'HDFC0001234',
                    'status': 'approved',
                    'commission_rate': Decimal('10.00'),
                    'rating': Decimal(str(round(random.uniform(3.5, 5.0), 2))),
                }
            )
            vendors.append(vendor)
            if created:
                self.stdout.write(f'  Created vendor: {vendor.store_name}')

        return vendors

    def create_suppliers(self, vendors):
        """Create suppliers for vendors."""
        from apps.vendors.models import Supplier

        self.stdout.write('Creating suppliers...')
        suppliers = []

        supplier_data = [
            {'name': 'ABC Electronics', 'contact_person': 'John Doe', 'email': 'abc@supplier.com', 'phone': '+919800000001'},
            {'name': 'XYZ Textiles', 'contact_person': 'Jane Smith', 'email': 'xyz@supplier.com', 'phone': '+919800000002'},
            {'name': 'PQR Home Goods', 'contact_person': 'Mike Johnson', 'email': 'pqr@supplier.com', 'phone': '+919800000003'},
            {'name': 'Global Imports', 'contact_person': 'Sarah Wilson', 'email': 'global@supplier.com', 'phone': '+919800000004'},
        ]

        for vendor in vendors:
            for data in random.sample(supplier_data, min(2, len(supplier_data))):
                supplier, created = Supplier.objects.get_or_create(
                    vendor=vendor,
                    email=data['email'],
                    defaults={
                        **data,
                        'address': '123 Supplier Street',
                        'city': 'Mumbai',
                        'state': 'Maharashtra',
                        'pincode': '400001',
                        'tax_id': f'29ABCDE{random.randint(1000, 9999)}F1Z5',
                        'status': 'active',
                    }
                )
                if created:
                    suppliers.append(supplier)
                    self.stdout.write(f'  Created supplier: {supplier.name} for {vendor.store_name}')

        return suppliers

    def create_warehouses(self, vendors):
        """Create warehouses."""
        from apps.warehouses.models import Warehouse

        self.stdout.write('Creating warehouses...')
        warehouses = []

        warehouse_data = [
            {'name': 'Main Warehouse', 'city': 'Mumbai', 'state': 'Maharashtra'},
            {'name': 'North Warehouse', 'city': 'Delhi', 'state': 'Delhi'},
            {'name': 'South Warehouse', 'city': 'Bangalore', 'state': 'Karnataka'},
        ]

        for i, vendor in enumerate(vendors):
            data = warehouse_data[i % len(warehouse_data)]
            warehouse, created = Warehouse.objects.get_or_create(
                vendor=vendor,
                code=f'WH-{vendor.id}-{i+1}',  # Added unique code
                defaults={
                    'name': f"{vendor.store_name} - {data['name']}",
                    'address': f'{100+i} Industrial Area',
                    'city': data['city'],
                    'state': data['state'],
                    'pincode': f'{400001 + i*10000}',
                    'manager': vendor.user,  # Changed from contact_person
                    'phone': vendor.user.phone,  # Changed from contact_phone
                    'email': vendor.user.email,  # Added email field
                    'status': 'active',  # Changed from is_active to status
                    'warehouse_type': 'owned',  # Added warehouse_type
                }
            )
            warehouses.append(warehouse)
            if created:
                self.stdout.write(f'  Created warehouse: {warehouse.name}')

        return warehouses


    def create_categories(self, vendors):
        """Create product categories."""
        from apps.products.models import Category

        self.stdout.write('Creating categories...')
        categories = []

        # Parent categories
        parent_cats = [
            {'name': 'Electronics', 'slug': 'electronics', 'description': 'Electronic devices and gadgets'},
            {'name': 'Fashion', 'slug': 'fashion', 'description': 'Clothing and accessories'},
            {'name': 'Home & Living', 'slug': 'home-living', 'description': 'Home decor and furniture'},
            {'name': 'Books', 'slug': 'books', 'description': 'Books and stationery'},
            {'name': 'Sports', 'slug': 'sports', 'description': 'Sports and fitness equipment'},
        ]

        for data in parent_cats:
            cat, created = Category.objects.get_or_create(
                slug=data['slug'],
                defaults={**data, 'level': 0, 'is_featured': True}
            )
            categories.append(cat)
            if created:
                self.stdout.write(f'  Created category: {cat.name}')

        # Sub-categories
        sub_cats = {
            'electronics': [
                {'name': 'Smartphones', 'slug': 'smartphones'},
                {'name': 'Laptops', 'slug': 'laptops'},
                {'name': 'Headphones', 'slug': 'headphones'},
                {'name': 'Cameras', 'slug': 'cameras'},
            ],
            'fashion': [
                {'name': 'Men\'s Clothing', 'slug': 'mens-clothing'},
                {'name': 'Women\'s Clothing', 'slug': 'womens-clothing'},
                {'name': 'Footwear', 'slug': 'footwear'},
                {'name': 'Accessories', 'slug': 'accessories'},
            ],
            'home-living': [
                {'name': 'Furniture', 'slug': 'furniture'},
                {'name': 'Kitchen', 'slug': 'kitchen'},
                {'name': 'Decor', 'slug': 'decor'},
            ],
        }

        for parent_slug, children in sub_cats.items():
            parent = Category.objects.get(slug=parent_slug)
            for data in children:
                cat, created = Category.objects.get_or_create(
                    slug=data['slug'],
                    defaults={
                        **data,
                        'parent': parent,
                        'level': 1,
                        'description': f'{data["name"]} category',
                    }
                )
                categories.append(cat)
                if created:
                    self.stdout.write(f'  Created sub-category: {cat.name}')

        return categories

    def create_products(self, vendors, categories):
        """Create products."""
        from apps.products.models import Product, ProductVariant, ProductImage
        from apps.products.models import Category

        self.stdout.write('Creating products...')
        products = []

        product_data = [
            # Electronics
            {'name': 'iPhone 15 Pro', 'category_slug': 'smartphones', 'base_price': 134900, 'selling_price': 129900},
            {'name': 'Samsung Galaxy S24', 'category_slug': 'smartphones', 'base_price': 79999, 'selling_price': 74999},
            {'name': 'MacBook Pro 14"', 'category_slug': 'laptops', 'base_price': 199900, 'selling_price': 189900},
            {'name': 'Dell XPS 15', 'category_slug': 'laptops', 'base_price': 149990, 'selling_price': 139990},
            {'name': 'Sony WH-1000XM5', 'category_slug': 'headphones', 'base_price': 29990, 'selling_price': 26990},
            {'name': 'AirPods Pro 2', 'category_slug': 'headphones', 'base_price': 24900, 'selling_price': 22900},
            # Fashion
            {'name': 'Cotton Casual Shirt', 'category_slug': 'mens-clothing', 'base_price': 1999, 'selling_price': 1499},
            {'name': 'Denim Jeans', 'category_slug': 'mens-clothing', 'base_price': 2499, 'selling_price': 1999},
            {'name': 'Summer Dress', 'category_slug': 'womens-clothing', 'base_price': 2999, 'selling_price': 2499},
            {'name': 'Running Shoes', 'category_slug': 'footwear', 'base_price': 5999, 'selling_price': 4999},
            # Home
            {'name': 'Wooden Coffee Table', 'category_slug': 'furniture', 'base_price': 12999, 'selling_price': 10999},
            {'name': 'Non-Stick Cookware Set', 'category_slug': 'kitchen', 'base_price': 4999, 'selling_price': 3999},
            {'name': 'Wall Art Canvas', 'category_slug': 'decor', 'base_price': 1999, 'selling_price': 1499},
        ]

        for i, data in enumerate(product_data):
            vendor = vendors[i % len(vendors)]
            try:
                category = Category.objects.get(slug=data['category_slug'])
            except Category.DoesNotExist:
                category = categories[0] if categories else None

            product, created = Product.objects.get_or_create(
                sku=f'PRD-{1000+i}',
                defaults={
                    'vendor': vendor,
                    'category': category,
                    'name': data['name'],
                    'slug': data['name'].lower().replace(' ', '-').replace('"', ''),
                    'short_description': f'High quality {data["name"]}',
                    'description': f'This is a detailed description for {data["name"]}. It comes with premium quality and excellent features.',
                    'base_price': Decimal(str(data['base_price'])),
                    'selling_price': Decimal(str(data['selling_price'])),
                    'cost_price': Decimal(str(int(data['base_price'] * 0.6))),
                    'tax_percentage': Decimal('18.00'),
                    'track_inventory': True,
                    'low_stock_threshold': 10,
                    'status': 'published',
                    'is_featured': i < 5,
                    'rating': Decimal(str(round(random.uniform(3.5, 5.0), 2))),
                    'review_count': random.randint(10, 100),
                    'images': [{
                        'image': 'https://via.placeholder.com/800x800.png?text=' + data['name'].replace(' ', '+'),
                        'alt_text': data['name'],
                        'is_primary': True
                    }]
                }
            )
            products.append(product)
            if created:
                self.stdout.write(f'  Created product: {product.name}')

                # Create variants for some products
                if 'shirt' in data['name'].lower() or 'dress' in data['name'].lower():
                    for size in ['S', 'M', 'L', 'XL']:
                        ProductVariant.objects.create(
                            product=product,
                            name=f'Size {size}',
                            sku=f'{product.sku}-{size}',
                            attributes={'size': size},
                            price=product.selling_price,
                        )

        return products

    def create_customers(self, users):
        """Create customer profiles."""
        from apps.customers.models import Customer

        self.stdout.write('Creating customers...')
        customers = []
        customer_users = [u for u in users if u.role == 'customer']

        for user in customer_users:
            customer, created = Customer.objects.get_or_create(
                user=user,
                defaults={
                    'loyalty_points': random.randint(0, 5000),
                    'total_spent': Decimal(str(random.randint(0, 100000))),
                    'total_orders': random.randint(0, 20),
                    'marketing_consent': random.choice([True, False]),
                }
            )
            customers.append(customer)
            if created:
                self.stdout.write(f'  Created customer: {user.email}')

        return customers

    def create_customer_addresses(self, customers):
        """Create customer addresses."""
        from apps.customers.models import CustomerAddress

        self.stdout.write('Creating customer addresses...')

        cities = [
            {'city': 'Mumbai', 'state': 'Maharashtra', 'pincode': '400001'},
            {'city': 'Delhi', 'state': 'Delhi', 'pincode': '110001'},
            {'city': 'Bangalore', 'state': 'Karnataka', 'pincode': '560001'},
            {'city': 'Chennai', 'state': 'Tamil Nadu', 'pincode': '600001'},
            {'city': 'Hyderabad', 'state': 'Telangana', 'pincode': '500001'},
        ]

        for customer in customers:
            # Shipping address
            city_data = random.choice(cities)
            CustomerAddress.objects.get_or_create(
                customer=customer,
                address_type='shipping',
                is_default=True,
                defaults={
                    'label': 'Home',
                    'full_name': customer.user.get_full_name(),
                    'phone': customer.user.phone,
                    'address_line1': f'{random.randint(1, 500)} Main Street',
                    'address_line2': f'Apt {random.randint(1, 20)}',
                    **city_data,
                }
            )

            # Billing address
            CustomerAddress.objects.get_or_create(
                customer=customer,
                address_type='billing',
                defaults={
                    'label': 'Office',
                    'full_name': customer.user.get_full_name(),
                    'phone': customer.user.phone,
                    'address_line1': f'{random.randint(1, 500)} Business Park',
                    **random.choice(cities),
                }
            )

        self.stdout.write(f'  Created addresses for {len(customers)} customers')

    def create_inventory(self, products, warehouses):
        from apps.inventory.models import Inventory

        self.stdout.write('Creating inventory...')

        for product in products:
            warehouse = random.choice(warehouses)

            Inventory.objects.get_or_create(
                product=product,
                warehouse=warehouse,
                vendor=product.vendor,   # REQUIRED by model
                defaults={
                    'quantity': random.randint(50, 300),
                    'reserved_quantity': random.randint(0, 20),
                    'buy_price': product.cost_price,
                    'sell_price': product.selling_price,
                    'mrp': product.base_price,
                    'stock_status': 'in_stock',
                    'inward_type': 'initial',
                }
            )

        self.stdout.write(f'Inventory created for {len(products)} products')


    def create_carts(self, customers, products):
        """Create shopping carts with items."""
        from apps.customers.models import Cart, CartItem

        self.stdout.write('Creating carts...')
        carts = []

        for customer in customers[:3]:  # Create carts for first 3 customers
            cart, created = Cart.objects.get_or_create(
                customer=customer,
                defaults={
                    'subtotal': Decimal('0'),
                    'total': Decimal('0'),
                }
            )
            carts.append(cart)

            if created:
                # Add random products to cart
                cart_products = random.sample(products, min(3, len(products)))
                subtotal = Decimal('0')
                for product in cart_products:
                    quantity = random.randint(1, 3)
                    total_price = product.selling_price * quantity
                    CartItem.objects.create(
                        cart=cart,
                        product=product,
                        quantity=quantity,
                        unit_price=product.selling_price,
                        total_price=total_price,
                    )
                    subtotal += total_price

                cart.subtotal = subtotal
                cart.total = subtotal
                cart.save()
                self.stdout.write(f'  Created cart for {customer.user.email}')

        return carts

    def create_wishlists(self, customers, products):
        """Create wishlists."""
        from apps.customers.models import Wishlist

        self.stdout.write('Creating wishlists...')

        for customer in customers:
            wishlist_products = random.sample(products, min(4, len(products)))
            for product in wishlist_products:
                Wishlist.objects.get_or_create(
                    customer=customer,
                    product=product,
                )

        self.stdout.write(f'  Created wishlists for {len(customers)} customers')

    def create_purchase_orders(self, vendors, suppliers, products, warehouses):
        """Create purchase orders."""
        from apps.purchase_orders.models import PurchaseOrder, PurchaseOrderItem
        from apps.vendors.models import Supplier

        self.stdout.write('Creating purchase orders...')
        purchase_orders = []

        for vendor in vendors:
            vendor_suppliers = Supplier.objects.filter(vendor=vendor)
            if not vendor_suppliers.exists():
                continue

            supplier = vendor_suppliers.first()
            warehouse = warehouses[0] if warehouses else None

            for i in range(2):  # 2 POs per vendor
                po, created = PurchaseOrder.objects.get_or_create(
                    po_number=f'PO-{vendor.id}-{1000+i}',
                    defaults={
                        'vendor': vendor,
                        'supplier': supplier,
                        'warehouse': warehouse,
                        'po_date': timezone.now().date(),   # REQUIRED
                        'status': random.choice(['draft', 'submitted', 'approved', 'received']),
                        'expected_delivery_date': timezone.now().date() + timezone.timedelta(days=random.randint(7, 30)),
                        'payment_status': 'pending',
                        'notes': f'Purchase order {i+1} for {vendor.store_name}',
                    }
                )

                purchase_orders.append(po)

                if not created:
                    continue

                # Products for this vendor
                vendor_products = [p for p in products if p.vendor == vendor][:3]

                for product in vendor_products:
                    qty = random.randint(10, 50)
                    unit_price = product.cost_price or Decimal("100")

                    PurchaseOrderItem.objects.create(
                        purchase_order=po,
                        product=product,
                        quantity_ordered=qty,
                        quantity_received=qty,     # received stock
                        unit_price=unit_price,
                        selling_price=product.selling_price,
                        discount_type=None,
                        discount_value=Decimal("0"),
                        tax_percentage=Decimal("18")
                    )
                    # subtotal, tax_amount & total auto-calculated in save()

                # 🔥 Let the model calculate correct totals
                po.calculate_totals()

                # Simulate paid PO
                po.paid_amount = po.total_amount
                po.payment_status = "paid"
                po.save(update_fields=["paid_amount", "payment_status"])

                self.stdout.write(f'  Created PO: {po.po_number}')

        return purchase_orders

    def create_sales_orders(self, customers, products, vendors):
        from apps.sales_orders.models import SalesOrder, SalesOrderItem
        from apps.customers.models import CustomerAddress

        self.stdout.write("Creating sales orders...")
        sales_orders = []

        # ===== VALIDATION PHASE =====
        # Filter out None values from vendors list
        vendors = [v for v in vendors if v is not None]
        
        if not vendors:
            self.stdout.write("❌ No vendors available")
            return sales_orders
        
        if not products:
            self.stdout.write("❌ No products available")
            return sales_orders
        
        if not customers:
            self.stdout.write("❌ No customers available")
            return sales_orders

        # Log vendor information for debugging
        self.stdout.write(f"  Available vendors: {len(vendors)}")
        for v in vendors:
            self.stdout.write(f"    - Vendor ID: {v.id}, Name: {v.store_name}")

        # ===== BUILD VENDOR-PRODUCT MAPPING =====
        vendor_products_map = {}
        for product in products:
            # Ensure product has both vendor and vendor_id
            if hasattr(product, 'vendor') and product.vendor and hasattr(product, 'vendor_id') and product.vendor_id:
                vendor_id = product.vendor_id
                if vendor_id not in vendor_products_map:
                    vendor_products_map[vendor_id] = []
                vendor_products_map[vendor_id].append(product)

        self.stdout.write(f"  Vendor-Product mapping: {len(vendor_products_map)} vendors have products")
        for vid, prods in vendor_products_map.items():
            self.stdout.write(f"    - Vendor {vid}: {len(prods)} products")

        # Filter to only vendors that have products
        valid_vendors = [v for v in vendors if v.id in vendor_products_map and len(vendor_products_map[v.id]) > 0]

        if not valid_vendors:
            self.stdout.write("❌ No valid vendors with products")
            return sales_orders

        self.stdout.write(f"  {len(valid_vendors)} vendors ready for sales orders")

        # ===== CREATE SALES ORDERS =====
        statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

        for i, customer in enumerate(customers):
            # Get shipping address
            address = CustomerAddress.objects.filter(
                customer=customer, 
                address_type='shipping'
            ).first()
            
            if not address:
                self.stdout.write(f"  ⚠️  No shipping address for {customer.user.email}, skipping")
                continue

            # Create 2 orders per customer
            for j in range(2):
                order_number = f"SO-{1000+i*10+j}"
                
                # Check if order already exists
                if SalesOrder.objects.filter(order_number=order_number).exists():
                    self.stdout.write(f"  Order {order_number} already exists, skipping")
                    continue

                # Select a random vendor
                vendor = random.choice(valid_vendors)
                
                # Triple-check vendor validity
                if not vendor:
                    self.stdout.write(f"  ❌ Vendor is None for {order_number}")
                    continue
                    
                if not hasattr(vendor, 'id') or vendor.id is None:
                    self.stdout.write(f"  ❌ Vendor has no ID for {order_number}")
                    continue
                
                # Get products for this vendor
                vendor_products = vendor_products_map.get(vendor.id, [])
                if not vendor_products:
                    self.stdout.write(f"  ❌ No products for vendor {vendor.id}")
                    continue
                
                status = random.choice(statuses)

                # Create the sales order
                try:
                    self.stdout.write(f"  Creating SO {order_number} for vendor {vendor.id} ({vendor.store_name})")
                    
                    so = SalesOrder.objects.create(
                        order_number=order_number,
                        customer=customer,
                        vendor_id=vendor.id,  # ✅ Use vendor_id directly
                        shipping_address=address,
                        billing_address=address,
                        status=status,
                        shipping_amount=Decimal("99"),
                        payment_status='paid' if status in ['shipped', 'delivered'] else 'pending'
                    )
                    
                    sales_orders.append(so)
                    self.stdout.write(f"  ✅ Created SO: {so.order_number}")

                    # Add items to the order
                    selected_products = random.sample(
                        vendor_products, 
                        min(3, len(vendor_products))
                    )
                    
                    items_created = 0
                    for product in selected_products:
                        qty = random.randint(1, 3)
                        price = product.selling_price if product.selling_price else Decimal("100")

                        SalesOrderItem.objects.create(
                            sales_order=so,
                            product=product,
                            quantity_ordered=qty,
                            quantity_delivered=qty if status == 'delivered' else 0,
                            unit_price=price,
                            discount_value=Decimal("0"),
                            tax_percentage=Decimal("18")
                        )
                        items_created += 1

                    self.stdout.write(f"     Added {items_created} items to {order_number}")

                    # Recalculate totals
                    so.calculate_totals()
                    
                except Exception as e:
                    self.stdout.write(f"  ❌ Error creating SO {order_number}: {str(e)}")
                    import traceback
                    self.stdout.write(f"     {traceback.format_exc()}")
                    continue

        self.stdout.write(f"  ✅ Total sales orders created: {len(sales_orders)}")
        return sales_orders


    def create_payments(self, sales_orders):
        """Create payments for orders."""
        from apps.payments.models import Payment

        self.stdout.write('Creating payments...')
        payments_created = 0

        for order in sales_orders:
            # Only create payments for paid orders
            if order.payment_status != 'paid':
                continue
            
            # Skip if order doesn't have a vendor
            if not order.vendor_id:
                self.stdout.write(f'  ⚠️  Skipping payment for order {order.order_number} - no vendor')
                continue
            
            # Skip if order doesn't have a customer
            if not order.customer_id:
                self.stdout.write(f'  ⚠️  Skipping payment for order {order.order_number} - no customer')
                continue

            try:
                payment, created = Payment.objects.get_or_create(
                    sales_order=order,
                    defaults={
                        'vendor_id': order.vendor_id,  # ✅ Add vendor_id from order
                        'customer_id': order.customer_id,  # ✅ Add customer_id from order
                        'amount': order.total_amount,
                        'payment_method': random.choice(['upi', 'card', 'netbanking', 'wallet']),
                        'status': 'completed',
                        'gateway_transaction_id': f'TXN{random.randint(100000, 999999)}',
                        'payment_gateway': 'razorpay',
                    }
                )
                
                if created:
                    payments_created += 1
                    self.stdout.write(f'  Created payment for order {order.order_number}')
                    
            except Exception as e:
                self.stdout.write(f'  ❌ Error creating payment for order {order.order_number}: {str(e)}')
                continue

        self.stdout.write(f'  ✅ Created {payments_created} payments for paid orders')

    def create_delivery_agents(self, users):
        """Create delivery agents."""
        from apps.delivery_agents.models import DeliveryAgent

        self.stdout.write('Creating delivery agents...')
        agents = []
        delivery_users = [u for u in users if u.role == 'delivery_agent']

        for user in delivery_users:
            agent, created = DeliveryAgent.objects.get_or_create(
                user=user,
                defaults={
                    'vehicle_type': random.choice(['bike', 'scooter', 'car']),
                    'vehicle_number': f'MH-{random.randint(10, 50)}-{random.choice("ABCDEFGH")}{random.choice("ABCDEFGH")}-{random.randint(1000, 9999)}',
                    'status': 'active',  # ✅ Changed from 'available' to 'active' (valid status)
                    'city': random.choice(['Mumbai', 'Delhi', 'Bangalore']),  # ✅ Changed from 'current_city' to 'city'
                    'rating': Decimal(str(round(random.uniform(3.5, 5.0), 2))),
                    'total_deliveries': random.randint(50, 500),
                    'successful_deliveries': random.randint(40, 490),  # ✅ Added field that exists
                    'is_available': True,  # ✅ Changed from 'is_verified' to 'is_available'
                    # Removed 'license_number' as it doesn't exist in the model
                    # The model has 'id_number' instead if you need to store license info
                }
            )
            agents.append(agent)
            if created:
                self.stdout.write(f'  Created delivery agent: {user.email}')

        self.stdout.write(f'  ✅ Total delivery agents created: {len(agents)}')
        return agents

    def create_delivery_assignments(self, sales_orders, delivery_agents):
        """Create delivery assignments."""
        from apps.delivery_agents.models import DeliveryAssignment

        self.stdout.write('Creating delivery assignments...')
        assignments_created = 0

        shipped_orders = [o for o in sales_orders if o.status in ['shipped', 'delivered']]

        if not delivery_agents:
            self.stdout.write('  ⚠️  No delivery agents available')
            return

        for order in shipped_orders:
            agent = random.choice(delivery_agents)
            
            # Determine status based on order status
            if order.status == 'delivered':
                assignment_status = 'delivered'
            else:  # shipped
                assignment_status = 'in_transit'
            
            # Prepare addresses
            shipping_address = {
                'address_line1': order.shipping_address.address_line1 if order.shipping_address else 'Default Address',
                'city': order.shipping_address.city if order.shipping_address else 'Mumbai',
                'state': order.shipping_address.state if order.shipping_address else 'Maharashtra',
                'pincode': order.shipping_address.pincode if order.shipping_address else '400001',
            }
            
            pickup_address = {
                'address_line1': 'Warehouse Address',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
            }
            
            assignment, created = DeliveryAssignment.objects.get_or_create(
                sales_order=order,
                defaults={
                    'delivery_agent': agent,
                    'status': assignment_status,  # ✅ Valid status from DeliveryStatus.CHOICES
                    'pickup_address': pickup_address,  # ✅ Required JSONField
                    'delivery_address': shipping_address,  # ✅ Required JSONField
                    'delivery_contact_name': order.shipping_address.full_name if order.shipping_address else order.customer.user.get_full_name(),  # ✅ Required field
                    'delivery_contact_phone': order.shipping_address.phone if order.shipping_address else order.customer.user.phone,  # ✅ Required field
                    'estimated_delivery_time': timezone.now() + timezone.timedelta(days=random.randint(1, 3)),  # ✅ Correct field name
                    'actual_delivery_time': timezone.now() if order.status == 'delivered' else None,  # ✅ Set if delivered
                    'delivery_fee': Decimal('99.00'),  # ✅ Added delivery fee
                    # Note: assigned_at is auto_now_add=True, so it's set automatically
                }
            )
            
            if created:
                assignments_created += 1
                self.stdout.write(f'  Created delivery assignment for order {order.order_number}')

        self.stdout.write(f'  ✅ Created {assignments_created} delivery assignments')

    def create_notifications(self, users):
        """Create notifications."""
        from apps.notifications.models import Notification, NotificationTemplate

        self.stdout.write('Creating notifications...')
        
        templates_created = 0
        notifications_created = 0

        # Create templates
        templates = [
            {
                'name': 'order_confirmed',
                'type': 'order',
                'title_template': 'Order Confirmed',
                'message_template': 'Your order {{order_number}} has been confirmed.'
            },
            {
                'name': 'order_shipped',
                'type': 'order',
                'title_template': 'Order Shipped',
                'message_template': 'Your order {{order_number}} has been shipped.'
            },
            {
                'name': 'order_delivered',
                'type': 'delivery',
                'title_template': 'Order Delivered',
                'message_template': 'Your order {{order_number}} has been delivered.'
            },
            {
                'name': 'welcome',
                'type': 'system',
                'title_template': 'Welcome!',
                'message_template': 'Welcome to our platform, {{user_name}}!'
            },
        ]

        for data in templates:
            template, created = NotificationTemplate.objects.get_or_create(
                name=data['name'],
                defaults={
                    'type': data['type'],  # ✅ Correct field name
                    'title_template': data['title_template'],  # ✅ Correct field name
                    'message_template': data['message_template'],  # ✅ Correct field name (not 'body')
                }
            )
            if created:
                templates_created += 1
                self.stdout.write(f'  Created template: {template.name}')

        # Create notifications for users
        # Using valid types from Notification.TYPE_CHOICES
        notification_types = ['order', 'payment', 'delivery', 'system', 'promo']
        
        for user in users[:5]:
            for i in range(3):
                notification = Notification.objects.create(
                    user=user,
                    type=random.choice(notification_types),  # ✅ Changed from 'notification_type' to 'type'
                    title=f'Notification {i+1}',
                    message=f'This is a sample notification message {i+1} for {user.email}',
                    is_read=random.choice([True, False]),
                )
                notifications_created += 1

        self.stdout.write(f'  ✅ Created {templates_created} notification templates')
        self.stdout.write(f'  ✅ Created {notifications_created} notifications for users')

    def create_product_reviews(self, products, customers, sales_orders):
        """Create product reviews."""
        from apps.products.models import ProductReview

        self.stdout.write('Creating product reviews...')

        review_titles = [
            'Great product!', 'Excellent quality', 'Good value for money',
            'Satisfied with purchase', 'Highly recommended', 'Worth every penny',
            'Amazing!', 'Very good', 'Nice product', 'As expected'
        ]

        review_texts = [
            'This product exceeded my expectations. The quality is excellent and delivery was fast.',
            'Very happy with this purchase. Would definitely buy again.',
            'Good product for the price. Works as described.',
            'Excellent build quality. Highly recommend to others.',
            'Fast shipping and product was well packed. Very satisfied.',
        ]

        delivered_orders = [o for o in sales_orders if o.status == 'delivered']

        for order in delivered_orders[:5]:
            customer = order.customer
            for item in order.items.all()[:2]:
                ProductReview.objects.get_or_create(
                    product=item.product,
                    customer=customer,
                    defaults={
                        'order': order,
                        'rating': random.randint(3, 5),
                        'title': random.choice(review_titles),
                        'review': random.choice(review_texts),
                        'is_verified_purchase': True,
                        'is_approved': True,
                        'helpful_count': random.randint(0, 50),
                    }
                )

        self.stdout.write(f'  Created product reviews')

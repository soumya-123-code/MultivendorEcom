"""
Constants and status definitions for the application.
"""


class POStatus:
    """Purchase Order status constants."""
    DRAFT = 'draft'
    PENDING_APPROVAL = 'pending_approval'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    SENT = 'sent'
    CONFIRMED = 'confirmed'
    RECEIVING = 'receiving'
    PARTIAL_RECEIVED = 'partial_received'
    RECEIVED = 'received'
    COMPLETE = 'complete'
    CANCELLED = 'cancelled'
    RETURNED = 'returned'
    
    CHOICES = [
        (DRAFT, 'Draft'),
        (PENDING_APPROVAL, 'Pending Approval'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (SENT, 'Sent to Supplier'),
        (CONFIRMED, 'Confirmed'),
        (RECEIVING, 'Receiving'),
        (PARTIAL_RECEIVED, 'Partially Received'),
        (RECEIVED, 'Received'),
        (COMPLETE, 'Complete'),
        (CANCELLED, 'Cancelled'),
        (RETURNED, 'Returned'),
    ]
    
    # List of all states for state machine
    LIST = [DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SENT, CONFIRMED, 
            RECEIVING, PARTIAL_RECEIVED, RECEIVED, COMPLETE, CANCELLED, RETURNED]
    
    # States that allow cancellation
    CANCELLABLE_STATES = [DRAFT, PENDING_APPROVAL, APPROVED, SENT]
    
    # States that allow editing
    EDITABLE_STATES = [DRAFT, REJECTED]


class SOStatus:
    """Sales Order status constants."""
    PENDING = 'pending'
    CONFIRMED = 'confirmed'
    PROCESSING = 'processing'
    PACKED = 'packed'
    READY_FOR_PICKUP = 'ready_for_pickup'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    DELIVERY_FAILED = 'delivery_failed'
    RETURN_REQUESTED = 'return_requested'
    RETURN_APPROVED = 'return_approved'
    RETURN_REJECTED = 'return_rejected'
    RETURN_SHIPPED = 'return_shipped'
    RETURN_RECEIVED = 'return_received'
    REFUNDED = 'refunded'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    
    CHOICES = [
        (PENDING, 'Pending'),
        (CONFIRMED, 'Confirmed'),
        (PROCESSING, 'Processing'),
        (PACKED, 'Packed'),
        (READY_FOR_PICKUP, 'Ready for Pickup'),
        (OUT_FOR_DELIVERY, 'Out for Delivery'),
        (DELIVERED, 'Delivered'),
        (DELIVERY_FAILED, 'Delivery Failed'),
        (RETURN_REQUESTED, 'Return Requested'),
        (RETURN_APPROVED, 'Return Approved'),
        (RETURN_REJECTED, 'Return Rejected'),
        (RETURN_SHIPPED, 'Return Shipped'),
        (RETURN_RECEIVED, 'Return Received'),
        (REFUNDED, 'Refunded'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]
    
    # List of all states for state machine
    LIST = [PENDING, CONFIRMED, PROCESSING, PACKED, READY_FOR_PICKUP, OUT_FOR_DELIVERY,
            DELIVERED, DELIVERY_FAILED, RETURN_REQUESTED, RETURN_APPROVED, RETURN_REJECTED,
            RETURN_SHIPPED, RETURN_RECEIVED, REFUNDED, COMPLETED, CANCELLED]
    
    # States that allow cancellation
    CANCELLABLE_STATES = [PENDING, CONFIRMED]
    
    # Final states
    FINAL_STATES = [DELIVERED, COMPLETED, REFUNDED, CANCELLED]


class OrderStatus:
    """Generic order status (alias for SOStatus)."""
    PENDING = SOStatus.PENDING
    CONFIRMED = SOStatus.CONFIRMED
    PROCESSING = SOStatus.PROCESSING
    COMPLETED = SOStatus.COMPLETED
    CANCELLED = SOStatus.CANCELLED
    
    CHOICES = [
        (PENDING, 'Pending'),
        (CONFIRMED, 'Confirmed'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]


class PaymentStatus:
    """Payment status constants."""
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REFUNDED = 'refunded'
    CANCELLED = 'cancelled'
    PARTIAL = 'partial'
    
    CHOICES = [
        (PENDING, 'Pending'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
        (REFUNDED, 'Refunded'),
        (CANCELLED, 'Cancelled'),
        (PARTIAL, 'Partial'),
    ]


class DeliveryStatus:
    """Delivery status constants."""
    ASSIGNED = 'assigned'
    ACCEPTED = 'accepted'
    PICKED_UP = 'picked_up'
    IN_TRANSIT = 'in_transit'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    FAILED = 'failed'
    RETURNED = 'returned'
    CANCELLED = 'cancelled'
    
    CHOICES = [
        (ASSIGNED, 'Assigned'),
        (ACCEPTED, 'Accepted'),
        (PICKED_UP, 'Picked Up'),
        (IN_TRANSIT, 'In Transit'),
        (OUT_FOR_DELIVERY, 'Out for Delivery'),
        (DELIVERED, 'Delivered'),
        (FAILED, 'Failed'),
        (RETURNED, 'Returned'),
        (CANCELLED, 'Cancelled'),
    ]


class VendorStatus:
    """Vendor status constants."""
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    SUSPENDED = 'suspended'
    INACTIVE = 'inactive'
    
    CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (SUSPENDED, 'Suspended'),
        (INACTIVE, 'Inactive'),
    ]


class ProductStatus:
    """Product status constants."""
    DRAFT = 'draft'
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    ARCHIVED = 'archived'
    
    CHOICES = [
        (DRAFT, 'Draft'),
        (ACTIVE, 'Active'),
        (INACTIVE, 'Inactive'),
        (ARCHIVED, 'Archived'),
    ]


class StockStatus:
    """Inventory stock status constants."""
    IN_STOCK = 'in_stock'
    LOW_STOCK = 'low_stock'
    OUT_OF_STOCK = 'out_of_stock'
    EXPIRED = 'expired'
    DAMAGED = 'damaged'
    
    CHOICES = [
        (IN_STOCK, 'In Stock'),
        (LOW_STOCK, 'Low Stock'),
        (OUT_OF_STOCK, 'Out of Stock'),
        (EXPIRED, 'Expired'),
        (DAMAGED, 'Damaged'),
    ]


class MovementType:
    """Inventory movement type constants."""
    INWARD = 'inward'
    OUTWARD = 'outward'
    TRANSFER = 'transfer'
    ADJUSTMENT = 'adjustment'
    DAMAGE = 'damage'
    LOSS = 'loss'
    RETURN = 'return'
    RESERVED = 'reserved'
    UNRESERVED = 'unreserved'
    
    CHOICES = [
        (INWARD, 'Inward'),
        (OUTWARD, 'Outward'),
        (TRANSFER, 'Transfer'),
        (ADJUSTMENT, 'Adjustment'),
        (DAMAGE, 'Damage'),
        (LOSS, 'Loss'),
        (RETURN, 'Return'),
        (RESERVED, 'Reserved'),
        (UNRESERVED, 'Unreserved'),
    ]

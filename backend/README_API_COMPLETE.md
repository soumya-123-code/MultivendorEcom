# ERP E-Commerce API Documentation (Updated)

## Base URL
```
/api/v1/
```

## Authentication
- **Method**: JWT (JSON Web Token) via OTP-based passwordless login
- **Token Types**: Access Token (15 min) + Refresh Token (7 days)
- **Header**: `Authorization: Bearer <access_token>`

---

## 1. Authentication Endpoints ✓ (Existing)
Base Path: `/api/v1/auth/`

## 2. User Management ✓ (Existing)
Base Path: `/api/v1/users/`

## 3. Vendor Endpoints ✓ (Existing)
Base Path: `/api/v1/vendors/`

## 4. Supplier Endpoints ✓ (Existing)
Base Path: `/api/v1/vendors/suppliers/`

## 5. Customer Endpoints ✓ (Existing)
Base Path: `/api/v1/customers/`

## 6. Product Endpoints ✓ (Existing)
Base Path: `/api/v1/products/`

## 7. Category Endpoints ✓ (Existing)
Base Path: `/api/v1/categories/`

---

## 8. Warehouse Endpoints ✓ (NEW)

### Base Path: `/api/v1/warehouses/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List warehouses |
| `/` | POST | Vendor/Admin | Create warehouse |
| `/{id}/` | GET | Vendor/Admin | Get warehouse details |
| `/{id}/` | PUT/PATCH | Vendor/Admin | Update warehouse |
| `/{id}/` | DELETE | Vendor/Admin | Delete warehouse |
| `/{id}/locations/` | GET | Vendor/Admin | Get warehouse locations |
| `/{id}/locations/` | POST | Vendor/Admin | Add location |
| `/{id}/stats/` | GET | Vendor/Admin | Get warehouse statistics |

### Rack/Shelf Locations: `/api/v1/warehouses/locations/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List locations |
| `/` | POST | Vendor/Admin | Create location |
| `/{id}/` | GET/PUT/PATCH/DELETE | Vendor/Admin | CRUD operations |

---

## 9. Inventory Endpoints ✓ (NEW)

### Base Path: `/api/v1/inventory/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List inventory items |
| `/` | POST | Vendor/Admin | Create inventory entry |
| `/{id}/` | GET | Vendor/Admin | Get inventory details |
| `/{id}/` | PUT/PATCH | Vendor/Admin | Update inventory |
| `/{id}/` | DELETE | Vendor/Admin | Delete inventory |
| `/{id}/adjust/` | POST | Vendor/Admin | Adjust quantity (+/-) |
| `/{id}/transfer/` | POST | Vendor/Admin | Transfer between warehouses |
| `/{id}/reserve/` | POST | Vendor/Admin | Reserve for order |
| `/{id}/unreserve/` | POST | Vendor/Admin | Release reservation |
| `/{id}/logs/` | GET | Vendor/Admin | Get movement logs |
| `/low-stock/` | GET | Vendor/Admin | Get low stock items |
| `/out-of-stock/` | GET | Vendor/Admin | Get out of stock items |
| `/expiring-soon/` | GET | Vendor/Admin | Get expiring items |
| `/summary/` | GET | Vendor/Admin | Get inventory summary |

---

## 10. Sales Order Endpoints ✓ (NEW)

### Base Path: `/api/v1/sales-orders/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List sales orders |
| `/` | POST | Authenticated | Create order |
| `/{id}/` | GET | Vendor/Admin | Get order details |
| `/{id}/` | PUT/PATCH | Vendor/Admin | Update order |
| `/{id}/confirm/` | POST | Vendor/Admin | Confirm pending order |
| `/{id}/process/` | POST | Vendor/Admin | Start processing |
| `/{id}/pack/` | POST | Vendor/Admin | Mark as packed |
| `/{id}/ready-for-pickup/` | POST | Vendor/Admin | Mark ready for pickup |
| `/{id}/cancel/` | POST | Vendor/Admin | Cancel order |
| `/{id}/update-status/` | POST | Vendor/Admin | Update status manually |
| `/{id}/status-logs/` | GET | Vendor/Admin | Get status history |
| `/{id}/assign-delivery/` | POST | Vendor/Admin | Assign delivery agent |
| `/{id}/approve-return/` | POST | Vendor/Admin | Approve return |
| `/{id}/reject-return/` | POST | Vendor/Admin | Reject return |

---

## 11. Purchase Order Endpoints ✓ (NEW)

### Base Path: `/api/v1/purchase-orders/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List purchase orders |
| `/` | POST | Vendor/Admin | Create PO |
| `/{id}/` | GET | Vendor/Admin | Get PO details |
| `/{id}/` | PUT/PATCH | Vendor/Admin | Update PO |
| `/{id}/submit/` | POST | Vendor/Admin | Submit for approval |
| `/{id}/approve/` | POST | Admin | Approve PO |
| `/{id}/reject/` | POST | Admin | Reject PO |
| `/{id}/send/` | POST | Vendor/Admin | Mark as sent to supplier |
| `/{id}/confirm/` | POST | Vendor/Admin | Confirm by supplier |
| `/{id}/cancel/` | POST | Vendor/Admin | Cancel PO |
| `/{id}/receive/` | POST | Vendor/Admin | Receive items (creates inventory) |
| `/{id}/complete/` | POST | Vendor/Admin | Mark as complete |
| `/{id}/status-logs/` | GET | Vendor/Admin | Get status history |

---

## 12. Delivery Agent Endpoints ✓ (NEW)

### Base Path: `/api/v1/delivery-agents/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Admin | List delivery agents |
| `/` | POST | Authenticated | Create agent profile |
| `/{id}/` | GET | Admin | Get agent details |
| `/{id}/` | PUT/PATCH | Admin | Update agent |
| `/{id}/` | DELETE | Admin | Delete agent |
| `/{id}/approve/` | POST | Admin | Approve agent |
| `/{id}/reject/` | POST | Admin | Reject agent |
| `/{id}/suspend/` | POST | Admin | Suspend agent |
| `/{id}/activate/` | POST | Admin | Activate agent |
| `/available/` | GET | Vendor/Admin | Get available agents |
| `/me/` | GET | Agent | Get own profile |
| `/me/` | PATCH | Agent | Update own profile |
| `/me/availability/` | POST | Agent | Set availability |
| `/me/location/` | POST | Agent | Update location |
| `/me/stats/` | GET | Agent | Get statistics |

---

## 13. Delivery Assignment Endpoints ✓ (NEW)

### Base Path: `/api/v1/deliveries/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List deliveries |
| `/{id}/` | GET | Vendor/Admin | Get delivery details |
| `/my/` | GET | Agent | Get my deliveries |
| `/{id}/accept/` | POST | Agent | Accept assignment |
| `/{id}/reject/` | POST | Agent | Reject assignment |
| `/{id}/pickup/` | POST | Agent | Mark as picked up |
| `/{id}/in-transit/` | POST | Agent | Mark in transit |
| `/{id}/out-for-delivery/` | POST | Agent | Mark out for delivery |
| `/{id}/complete/` | POST | Agent | Complete with proof |
| `/{id}/fail/` | POST | Agent | Mark as failed |
| `/{id}/collect-cod/` | POST | Agent | Collect COD payment |
| `/{id}/status-logs/` | GET | All | Get status history |
| `/{id}/proofs/` | GET/POST | All | Get/add delivery proofs |
| `/{id}/reassign/` | POST | Admin | Reassign to another agent |

---

## 14. Notification Endpoints ✓ (NEW)

### Base Path: `/api/v1/notifications/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Authenticated | List notifications |
| `/{id}/` | GET | Authenticated | Get notification (marks as read) |
| `/{id}/` | DELETE | Authenticated | Delete notification |
| `/{id}/mark-read/` | POST | Authenticated | Mark as read |
| `/mark-all-read/` | POST | Authenticated | Mark all as read |
| `/unread/` | GET | Authenticated | Get unread notifications |
| `/count/` | GET | Authenticated | Get notification counts |
| `/clear-all/` | DELETE | Authenticated | Delete all notifications |
| `/send/` | POST | Admin | Send to specific user |
| `/broadcast/` | POST | Admin | Broadcast to users |
| `/templates/` | GET/POST | Admin | Manage templates |

---

## 15. Payment Endpoints ✓ (NEW)

### Base Path: `/api/v1/payments/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List payments |
| `/{id}/` | GET | Vendor/Admin | Get payment details |
| `/initiate/` | POST | Authenticated | Initiate payment |
| `/{id}/confirm/` | POST | Authenticated | Confirm payment |
| `/{id}/fail/` | POST | Vendor/Admin | Mark as failed |
| `/summary/` | GET | Vendor/Admin | Get payment summary |

### Refunds: `/api/v1/payments/refunds/`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Vendor/Admin | List refunds |
| `/` | POST | Authenticated | Request refund |
| `/{id}/` | GET | Vendor/Admin | Get refund details |
| `/{id}/process/` | POST | Admin | Approve/reject refund |

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Paginated Response
```json
{
  "count": 100,
  "next": "http://api/v1/resource/?page=2",
  "previous": null,
  "results": []
}
```

---

## Order/PO Status Flow

### Sales Order Status Flow:
```
pending → confirmed → processing → packed → ready_for_pickup → out_for_delivery → delivered
                                                                              ↓
                                                                    delivery_failed → (retry)
                                         ↓
              return_requested → return_approved → return_shipped → return_received → refunded
                              ↓
                        return_rejected
```

### Purchase Order Status Flow:
```
draft → pending_approval → approved → sent → confirmed → receiving → partial_received/received → complete
                        ↓
                     rejected (→ draft for edit)
```

### Delivery Status Flow:
```
assigned → accepted → picked_up → in_transit → out_for_delivery → delivered
                                                                ↓
                                                             failed → (reassign)
```

---

## Permission Levels

| Level | Description |
|-------|-------------|
| Public | No authentication required |
| Authenticated | Any authenticated user |
| Admin | Admin role required |
| Vendor/Admin | Either vendor or admin |
| Agent | Delivery agent only |
| Customer | Customer only |

# Shipment Tracking System - API Documentation

## Base URL
```
http://localhost:1337/api
```

## Authentication
All endpoints (except public ones) require JWT authentication in the header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Admin Login
**URL:** `POST /admin/login`  
**Description:** Authenticate admin user and return JWT token  
**Authentication:** None (Public)

**Request Body:**
```json
{
  "identifier": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 1.2 Admin Registration (Superadmin only)
**URL:** `POST /admin/register`  
**Description:** Create new admin user (requires superadmin role)  
**Authentication:** Required (Superadmin)

**Request Body:**
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Response:**
```json
{
  "message": "Admin created successfully",
  "admin": {
    "id": 2,
    "username": "newadmin",
    "email": "newadmin@example.com",
    "role": "admin"
  }
}
```

### 1.3 Get Admin Profile
**URL:** `GET /admin/profile`  
**Description:** Get current admin profile  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "admin": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## 2. Customer Endpoints

### 2.1 Get All Customers
**URL:** `GET /customers`  
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 25)  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "customers": [
    {
      "id": 1,
      "name": "John Doe",
      "address": "123 Main St",
      "phone": "+1234567890",
      "isPublished": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "shipments": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "pages": 4
  }
}
```

### 2.2 Get Customer by ID
**URL:** `GET /customers/:id`  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "address": "123 Main St",
  "phone": "+1234567890",
  "isPublished": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "shipments": [
    {
      "id": 1,
      "orderId": "ORD-001",
      "trackingId": "TRK-001",
      "statusUpdates": [...]
    }
  ]
}
```

### 2.3 Create Customer
**URL:** `POST /customers`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "John Doe",
  "address": "123 Main St, City, State",
  "phone": "+1234567890",
  "isPublished": true
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "address": "123 Main St, City, State",
  "phone": "+1234567890",
  "isPublished": true,
  "publishedAt": "2023-01-01T00:00:00.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "shipments": []
}
```

### 2.4 Update Customer
**URL:** `PUT /customers/:id`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "John Updated",
  "address": "456 New St",
  "phone": "+0987654321"
}
```

**Response:** Updated customer object

### 2.5 Delete Customer
**URL:** `DELETE /customers/:id`  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "message": "Customer deleted successfully"
}
```

### 2.6 Search Customers
**URL:** `GET /customers/search?query=john`  
**Query Parameters:**
- `query`: Search term (name or phone)  
**Authentication:** Required (Admin)

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "address": "123 Main St",
    "phone": "+1234567890",
    "shipments": [...]
  }
]
```

---

## 3. Shipment Endpoints

### 3.1 Get All Shipments
**URL:** `GET /shipments`  
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `status` (optional): Filter by status  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "shipments": [
    {
      "sNo": 1,
      "id": 1,
      "orderId": "ORD-001",
      "trackingId": "TRK-001",
      "customer": "John Doe",
      "address": "123 Main St",
      "phone": "+1234567890",
      "status": "picked_up",
      "date": "01/01/2023",
      "estimatedDelivery": "05/01/2023",
      "lastUpdate": "2023-01-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### 3.2 Get Shipment Details
**URL:** `GET /shipments/:id`  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "id": 1,
  "orderId": "ORD-001",
  "trackingId": "TRK-001",
  "orderDate": "2023-01-01T00:00:00.000Z",
  "estimatedDelivery": "2023-01-05T00:00:00.000Z",
  "order_status": "picked_up",
  "originAddress": "Warehouse A",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "address": "123 Main St",
    "phone": "+1234567890"
  },
  "statusUpdates": [
    {
      "id": 1,
      "status": "yet_to_be_picked",
      "details": "Order received",
      "location": "Warehouse A",
      "timestamp": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3.3 Create Shipment
**URL:** `POST /shipments`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "orderId": "ORD-001",
  "trackingId": "TRK-001",
  "customerId": 1,
  "orderDate": "2023-01-01",
  "estimatedDelivery": "2023-01-05",
  "originAddress": "Warehouse A",
  "deliveryAddress": "123 Main St",
  "order_status": "yet_to_be_picked"
}
```

**Response:**
```json
{
  "message": "Shipment created successfully",
  "shipment": {
    "id": 1,
    "orderId": "ORD-001",
    "trackingId": "TRK-001",
    "customerId": 1,
    "orderDate": "2023-01-01T00:00:00.000Z",
    "order_status": "yet_to_be_picked",
    "isPublished": true
  }
}
```

### 3.4 Update Shipment
**URL:** `PUT /shipments/:id`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "orderId": "ORD-001-UPDATED",
  "estimatedDelivery": "2023-01-06",
  "order_status": "in_transit"
}
```

**Response:** Updated shipment object

### 3.5 Delete Shipment
**URL:** `DELETE /shipments/:id`  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "message": "Shipment deleted successfully"
}
```

### 3.6 Track Shipment (Public)
**URL:** `GET /shipments/track/:trackingId`  
**Description:** Public endpoint to track shipment status  
**Authentication:** None (Public)

**Response:**
```json
{
  "id": 1,
  "orderId": "ORD-001",
  "trackingId": "TRK-001",
  "status": "picked_up",
  "estimatedDelivery": "2023-01-05T00:00:00.000Z",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "address": "123 Main St",
    "phone": "+1234567890"
  },
  "statusUpdates": [
    {
      "id": 1,
      "status": "yet_to_be_picked",
      "details": "Order received",
      "location": "Warehouse A",
      "timestamp": "2023-01-01T00:00:00.000Z",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3.7 Add Status Update by Tracking ID
**URL:** `POST /shipments/:trackingId/status`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "status": "picked_up",
  "details": "Package picked up from warehouse",
  "timestamp": "2023-01-02T10:30:00.000Z"
}
```

**Response:**
```json
{
  "message": "Status updated successfully",
  "statusUpdate": {
    "id": 2,
    "order_status": "picked_up",
    "details": "Package picked up from warehouse",
    "timestamp": "2023-01-02T10:30:00.000Z",
    "status_update_ord": 2
  }
}
```

### 3.8 Bulk Import Shipments
**URL:** `POST /shipments/import`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "shipments": [
    {
      "orderId": "ORD-001",
      "trackingId": "TRK-001",
      "customerId": 1,
      "orderDate": "2023-01-01",
      "order_status": "yet_to_be_picked"
    },
    {
      "orderId": "ORD-002",
      "trackingId": "TRK-002",
      "customerId": 2,
      "orderDate": "2023-01-02",
      "order_status": "yet_to_be_picked"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Shipments imported successfully",
  "count": 2
}
```

### 3.9 Get Dashboard Data
**URL:** `GET /shipments/dashboard`  
**Authentication:** Required (Admin)

**Response:**
```json
{
  "stats": {
    "totalShipments": 150,
    "deliveredCount": 75,
    "inTransitCount": 50,
    "pendingCount": 25
  },
  "recentShipments": [
    {
      "id": 1,
      "orderId": "ORD-001",
      "trackingId": "TRK-001",
      "orderDate": "2023-01-01T00:00:00.000Z",
      "order_status": "delivered",
      "customer": {
        "name": "John Doe"
      }
    }
  ]
}
```

### 3.10 Get Status Options
**URL:** `GET /shipments/status-options`  
**Authentication:** Required (Admin)

**Response:**
```json
[
  {
    "value": "yet_to_be_picked",
    "label": "Yet to be Picked",
    "icon": "⏳"
  },
  {
    "value": "picked_up",
    "label": "Picked Up",
    "icon": "📦"
  },
  {
    "value": "in_transit",
    "label": "In Transit",
    "icon": "🚚"
  },
  {
    "value": "delivered",
    "label": "Delivered",
    "icon": "✅"
  }
]
```

---

## 4. Status Values Reference

| Status | Description |
|--------|-------------|
| `yet_to_be_picked` | Order received but not yet picked up |
| `picked_up` | Package has been picked up |
| `in_transit` | Package is in transit |
| `on_the_way` | Package is on the way to destination |
| `terminal_shipping` | Package at terminal for shipping |
| `out_for_delivery` | Package out for delivery |
| `delivered` | Package successfully delivered |
| `delivery_rejected` | Delivery was rejected |
| `onhold` | Package on hold |
| `returned` | Package being returned |
| `cancelled` | Order cancelled |

---

## 5. Error Responses

### 5.1 Authentication Error
```json
{
  "error": "Invalid token"
}
```

### 5.2 Validation Error
```json
{
  "error": "Name, address, and phone are required fields"
}
```

### 5.3 Not Found Error
```json
{
  "error": "Customer not found"
}
```

### 5.4 Permission Error
```json
{
  "error": "Forbidden: insufficient role"
}
```

### 5.5 Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## 6. Pagination

All list endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default varies by endpoint)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "pages": 4
  }
}
```

---

## 7. Rate Limiting

Currently no rate limiting implemented. For production, consider implementing:
- Express Rate Limit middleware
- IP-based throttling
- API key-based rate limits

---

## 8. Testing with cURL Examples

### 8.1 Login and Get Token
```bash
curl -X POST http://localhost:1337/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'
```

### 8.2 Get All Customers (with auth)
```bash
curl -X GET http://localhost:1337/api/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8.3 Create New Shipment
```bash
curl -X POST http://localhost:1337/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "ORD-100",
    "trackingId": "TRK-100",
    "customerId": 1,
    "order_status": "yet_to_be_picked"
  }'
```

### 8.4 Track Shipment (public)
```bash
curl -X GET http://localhost:1337/api/shipments/track/TRK-100
```


This API documentation provides comprehensive information about all endpoints, request/response formats, and examples for integrating with the Shipment Tracking System backend.
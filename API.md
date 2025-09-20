# Inventory API Documentation

Base URL: `http://localhost:4000`

Auth: Bearer JWT in `Authorization` header after login.

## Auth

POST `/api/auth/login`

- Body:

```json
{ "email": "admin@example.com", "password": "password" }
```

- 200:

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin",
    "name": "Admin"
  },
  "token": "<jwt>"
}
```

GET `/api/auth/me`

- Headers: `Authorization: Bearer <jwt>`
- 200: `{ "success": true, "user": {"id":1,"email":"...","role":"...","name":"..."} }`

POST `/api/auth/logout`

- Headers: `Authorization: Bearer <jwt>`
- 200: `{ "success": true, "message": "Logged out" }`

## Customers

GET `/api/customers`

- Headers: `Authorization`
- Query: `search` `page` `limit` `customerType` `isActive`
- 200:

```json
{
  "success": true,
  "data": [{ "id": 1, "name": "..." }],
  "pagination": { "page": 1, "limit": 10, "total": 0, "pages": 0 }
}
```

POST `/api/customers`

- Headers: `Authorization`
- Body:

```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": "Street",
  "company": "ACME",
  "gstNumber": "GSTIN",
  "customerType": "retail",
  "creditLimit": 10000,
  "paymentTerms": "immediate",
  "isActive": true,
  "notes": "VIP",
  "tags": ["tag1"]
}
```

- 201: `{ "success": true, "message": "Customer created successfully", "data": { ... } }`

GET `/api/customers/:id`

- Headers: `Authorization`
- 200: `{ "success": true, "data": { ... } }`

PUT `/api/customers/:id`

- Headers: `Authorization`
- Body: Same as POST
- 200: `{ "success": true, "message": "Customer updated successfully", "data": { ... } }`

DELETE `/api/customers/:id`

- Headers: `Authorization`
- 200: `{ "success": true, "message": "Customer deleted successfully" }`

GET `/api/customers/search?q=...&limit=...`

- Headers: `Authorization`
- Query: `q` (search term), `limit` (max results, default 10)
- 200: `{ "success": true, "data": [...] }`

POST `/api/customers/find-or-create`

- Headers: `Authorization`
- Body:

```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "company": "ACME",
  "address": {
    "street": "...",
    "city": "...",
    "state": "...",
    "pincode": "..."
  }
}
```

- 200/201: `{ "success": true, "message": "...", "data": { ... }, "isNew": true/false }`

## Designs

GET `/api/designs`

- Headers: `Authorization`

POST `/api/designs` (admin)

- Headers: `Authorization`
- Body:

```json
{
  "name": "Ring",
  "number": "D-001",
  "imageUrl": "https://...",
  "prices": [],
  "defaultStones": []
}
```

PUT `/api/designs/:id` (admin)

- Headers: `Authorization`
- Body same as POST

POST `/api/designs/bulk-delete` (admin)

- Headers: `Authorization`
- Body: `{ "ids": [1,2,3] }`

## Inventory

### Stones

- GET `/api/inventory/stones` (auth)
- POST `/api/inventory/stones` (admin)

```json
{
  "name": "Stone A",
  "number": "S-001",
  "color": "red",
  "size": "2mm",
  "unit": "pcs",
  "inventoryType": "internal",
  "quantity": 100
}
```

- PUT `/api/inventory/stones/:id` (admin)

```json
{
  "name": "Stone A",
  "number": "S-001",
  "color": "red",
  "size": "2mm",
  "unit": "pcs",
  "inventoryType": "internal"
}
```

- PATCH `/api/inventory/stones/:id/quantity` (auth)

```json
{ "quantity": 120 }
```

- DELETE `/api/inventory/stones/:id` (admin)

- POST `/api/inventory/stones/bulk-delete` (admin)

```json
{ "ids": ["uuid1", "uuid2", "uuid3"] }
```

### Paper

- GET `/api/inventory/paper` (auth)
- POST `/api/inventory/paper` (admin)

```json
{
  "name": "Paper A",
  "width": 42,
  "quantity": 100,
  "totalPieces": 100,
  "unit": "pcs",
  "piecesPerRoll": 10,
  "weightPerPiece": 0.5,
  "inventoryType": "internal"
}
```

- PUT `/api/inventory/paper/:id` (admin)

```json
{
  "name": "Paper A",
  "width": 42,
  "totalPieces": 100,
  "unit": "pcs",
  "piecesPerRoll": 10,
  "weightPerPiece": 0.5,
  "inventoryType": "internal"
}
```

- POST `/api/inventory/paper/bulk-delete` (admin)

```json
{ "ids": ["uuid1", "uuid2", "uuid3"] }
```

### Plastic

- GET `/api/inventory/plastic` (auth)
- POST `/api/inventory/plastic` (admin)

```json
{ "name": "Plastic A", "width": 24, "quantity": 100, "unit": "pcs" }
```

- PUT `/api/inventory/plastic/:id` (admin)

```json
{ "name": "Plastic A", "width": 24, "unit": "pcs" }
```

- POST `/api/inventory/plastic/bulk-delete` (admin)

```json
{ "ids": ["uuid1", "uuid2", "uuid3"] }`
```

### Tape

- GET `/api/inventory/tape` (auth)
- POST `/api/inventory/tape` (admin)

```json
{ "name": "Cello Tape", "quantity": 100, "unit": "pcs" }
```

- PUT `/api/inventory/tape/:id` (admin)

```json
{ "name": "Cello Tape", "unit": "pcs" }
```

- PATCH `/api/inventory/tape/:id/quantity` (auth)

```json
{ "quantity": 150 }
```

- POST `/api/inventory/tape/bulk-delete` (admin)

```json
{ "ids": ["uuid1", "uuid2", "uuid3"] }
```

## Inventory Entries

GET `/api/inventory-entries`

- Headers: `Authorization`
- Query: `page` `limit` `type` `status`
- 200:

```json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 0, "pages": 0 }
}
```

POST `/api/inventory-entries`

- Headers: `Authorization`
- Body:

```json
{
  "inventoryType": "paper",
  "items": [
    {
      "itemId": "uuid",
      "quantity": 100,
      "unit": "pcs"
    }
  ],
  "supplierId": "uuid",
  "billNumber": "BILL-001",
  "billDate": "2024-01-15",
  "approvedBy": "uuid",
  "sourceOrderId": "uuid",
  "status": "pending",
  "notes": "Received from supplier"
}
```

- 201: `{ "success": true, "message": "Inventory entry created successfully", "data": { ... } }`

## Orders

GET `/api/orders` (auth)

- Query: `page` `limit`

POST `/api/orders` (auth)

```json
{
  "type": "sale",
  "customerName": "John Doe",
  "phone": "9876543210",
  "customerId": null,
  "gstNumber": null,
  "designOrders": [],
  "modeOfPayment": "cash",
  "paymentStatus": "pending",
  "discountType": "percentage",
  "discountValue": 0,
  "discountedAmount": 0,
  "finalAmount": 0,
  "notes": null
}
```

GET `/api/orders/:id`

- Headers: `Authorization`
- 200: `{ "success": true, "data": { ... } }`

PUT `/api/orders/:id`

- Headers: `Authorization`
- Body: Same as POST with additional fields for updates
- 200: `{ "success": true, "message": "Order updated successfully", "data": { ... } }`

DELETE `/api/orders/:id` (admin)

- Headers: `Authorization`
- 200: `{ "success": true, "message": "Order deleted successfully" }`

## Reports

GET `/api/reports/inventory-entries` (auth)

- Query: `page` `limit`

GET `/api/reports/generate?type=orders|inventory|users` (admin)

- Headers: `Authorization`
- Query: `type` (orders, inventory, users, analytics, all)
- 200: `{ "success": true, "data": { ... }, "analytics": { ... } }`

GET `/api/reports/export?type=...` (admin)

- Headers: `Authorization`
- Query: `type` (orders, inventory, users, customers)
- 200: CSV file download

## Masters (Admin)

GET `/api/masters/users`

POST `/api/masters/users`

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "role": "employee",
  "name": "User Name"
}
```

PUT `/api/masters/users/:id`

```json
{ "role": "employee", "name": "User Name", "status": "active" }
```

## Suppliers

GET `/api/suppliers` (auth)

- Query: `search` `status` `page` `limit`

POST `/api/suppliers` (auth)

```json
{
  "name": "Supplier A",
  "phone": "9999999999",
  "email": "supplier@example.com",
  "address": "Somewhere",
  "notes": "Preferred",
  "contactPerson": "John Smith",
  "status": "active"
}
```

GET `/api/suppliers/:id`

- Headers: `Authorization`
- 200: `{ "success": true, "data": { ... } }`

PUT `/api/suppliers/:id`

- Headers: `Authorization`
- Body: Same as POST
- 200: `{ "success": true, "message": "Supplier updated successfully", "data": { ... } }`

DELETE `/api/suppliers/:id`

- Headers: `Authorization`
- 200: `{ "success": true, "message": "Supplier deleted successfully" }`

## File Upload

POST `/api/upload`

- Headers: `Authorization: Bearer <jwt>`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field
- Roles: `admin`, `manager`
- File restrictions: Images only, max 5MB, min 1 byte
- 200:

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "image.jpg",
    "originalName": "original.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "dataUrl": "data:image/jpeg;base64,..."
  }
}
```

## Auth & Errors

- All protected routes require `Authorization: Bearer <jwt>`.
- Errors return `{ success: false, message: string }` and may include `error` with details.
- File uploads require `admin` or `manager` role.
- Bulk operations require `admin` role.
- Most CRUD operations support pagination with `page` and `limit` query parameters.

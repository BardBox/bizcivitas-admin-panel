# Backend Requirements for Franchise & Admin User Creation

## Overview
The current `/users/register` endpoint is designed for public member registration and enforces payment logic (Razorpay order ID) for memberships. This is unsuitable for creating administrative and franchise users (Master Franchise, Area Franchise, CGC, DCP) from the admin panel.

We need a dedicated endpoint to create these users without payment requirements and to handle their specific hierarchy assignments.

## Proposed Endpoint
**POST** `/api/v1/users/create-admin`

### Request Body
```json
{
  "fname": "John",
  "lname": "Doe",
  "email": "john.doe@example.com",
  "mobile": "9876543210",
  "password": "securePassword123",
  "role": "master-franchise", // Enum: 'master-franchise', 'area-franchise', 'cgc', 'dcp'
  "zoneId": "64f...", // Optional: ID of the zone to assign (for MF, AF, etc.)
  "areaId": "64e...", // Optional: ID of the area to assign (for AF, CGC)
  "city": "Vadodara", // Optional: Can be derived from Zone
  "state": "Gujarat", // Optional
  "country": "India"  // Optional
}
```

### Backend Logic
1.  **Validation:**
    *   Check if `email` or `mobile` already exists.
    *   Validate required fields (`fname`, `email`, `mobile`, `role`, `password`).
    *   Ensure `role` is one of the allowed administrative roles.

2.  **User Creation:**
    *   Create a new User document.
    *   Set `isEmailVerified` to `true` (since created by admin).
    *   Set `membershipStatus` to `active` (or equivalent) without requiring payment.
    *   **Skip** Razorpay order creation and validation.

3.  **Hierarchy Assignment (Side Effects):**
    *   **Master Franchise (`master-franchise`):**
        *   Validate `zoneId` is provided.
        *   Update the `Zone` document with `_id: zoneId`: set `assignedMFId` to the new user's ID.
    *   **Area Franchise (`area-franchise`):**
        *   Validate `areaId` is provided.
        *   Update the `Area` document with `_id: areaId`: set `areaFranchise` (or `assignedAFId`) to the new user's ID.
    *   **CGC / DCP:**
        *   Perform similar assignments if they are directly linked to a Zone or Area document.

### Response
**Success (201 Created):**
```json
{
  "success": true,
  "message": "Franchise user created successfully",
  "data": {
    "_id": "user_id_here",
    "fname": "John",
    "email": "john.doe@example.com",
    "role": "master-franchise"
  }
}
```

**Error (400 Bad Request):**
*   "Email already exists"
*   "Zone ID required for Master Franchise"
*   "Invalid Role"

## Immediate Action Required
The backend team needs to implement this endpoint. Until then, the "Create Franchise" form on the frontend will fail with validation errors from the existing `/users/register` endpoint.

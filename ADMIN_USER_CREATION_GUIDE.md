# Admin Panel - User Creation Guide

> **Last Updated**: November 28, 2025
> **Purpose**: Complete guide for creating users through the BizCivitas Admin Panel

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Membership Types](#membership-types)
4. [Form Fields](#form-fields)
5. [API Implementation](#api-implementation)
6. [Validation Rules](#validation-rules)
7. [Step-by-Step Guide](#step-by-step-guide)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Admin Panel allows authorized administrators to create new users with different roles and membership types. The user creation form is located in:

**File**: `src/pages/user/user.tsx`

**Access**: Admin Login → Users Page → "Add User" Button

---

## User Roles

### Available Roles (Updated to match backend)

| Role | Value | Description | Use Case |
|------|-------|-------------|----------|
| **User** | `user` | Regular member | Standard BizCivitas members |
| **Core Member** | `core-member` | Core group leader | Community leaders, chapter heads |
| **Admin** | `admin` | Administrator | System administrators with full access |

### ✅ **Changes Made**
- **Removed**: `"Digital Member"` (was incorrect)
- **Added**: `"admin"` (matches backend `constants.js`)

---

## Membership Types

| Membership Type | Description | Fee Structure | User Type |
|----------------|-------------|---------------|-----------|
| **Core Membership** | Full membership with community benefits | Registration: ₹25,000<br>Annual: ₹3,00,000<br>Community Launch: ₹2,25,000 | Core members |
| **Flagship Membership** | Premium membership | Registration: ₹25,000<br>Annual: ₹3,00,000<br>Meeting: ₹25,000 | Flagship community members |
| **Industria Membership** | Industry-specific membership | Registration: ₹25,000<br>Annual: ₹3,00,000<br>Meeting: ₹25,000 | Industria community members |
| **Digital Membership** | Online-only membership | Registration: ₹6,999 (1 year) | Digital-only members |
| **Digital Membership Trial** | Free trial (7 days) | Free | Trial users |

---

## Form Fields

### Required Fields

| Field | Type | Validation | Required For |
|-------|------|------------|--------------|
| **First Name** | Text | Alphabets only | All users |
| **Email** | Email | Valid email format | All users |
| **Mobile** | Number | 10 digits | All users |
| **Membership Type** | Dropdown | From predefined list | All users |
| **Role** | Dropdown | From predefined list | All users |

### Conditional Fields

#### For Non-Digital Memberships (Core, Flagship, Industria):
- **Region** (Required) - Dropdown from regions list
- **Referred By** (Optional) - Dropdown of core members

#### For Digital Memberships (Digital, Digital Trial):
- **City** (Required) - Text input
- **State** (Required) - Text input
- **Country** (Required) - Text input

### Optional Fields
- **Last Name** - Alphabets only
- **Username** - Alphanumeric and underscores only

---

## API Implementation

### Endpoint

```
POST /users/register
```

### Request Headers
```http
Authorization: Bearer <admin-access-token>
Content-Type: application/json
```

### Request Payload

#### For Core/Flagship/Industria Membership:
```json
{
  "name": "Rajesh Patel",
  "email": "rajesh@example.com",
  "mobile": "9876543210",
  "region": "64f1a2b3c4d5e6f7g8h9i0j1",
  "membershipType": "Core Membership",
  "role": "core-member",
  "referBy": "64f1a2b3c4d5e6f7g8h9i0j2",
  "username": "rajesh_patel"
}
```

#### For Digital Membership:
```json
{
  "name": "Priya Shah",
  "email": "priya@example.com",
  "mobile": "9876543211",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "membershipType": "Digital Membership",
  "role": "user",
  "username": "priya_shah"
}
```

### Response (Success)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "fname": "Rajesh",
    "lname": "Patel",
    "email": "rajesh@example.com",
    "mobile": 9876543210,
    "role": "core-member",
    "membershipType": "Core Membership",
    "isActive": true,
    "isApproved": true,
    "createdAt": "2025-11-28T10:00:00.000Z"
  }
}
```

### Response (Error - Duplicate Email)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "User already registered with Core Membership",
  "error": {
    "isRegistered": true,
    "duplicateFields": ["email"],
    "message": "User already registered with Core Membership"
  }
}
```

---

## Validation Rules

### Client-Side Validation (Real-Time)

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| **First Name** | `/^[A-Za-z]+$/` | "First Name should contain only alphabets" |
| **Last Name** | `/^[A-Za-z]+$/` | "Last Name should contain only alphabets" |
| **Email** | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | "Please enter a valid email address" |
| **Mobile** | `/^[0-9]{10}$/` | "Please enter a valid 10-digit mobile number" |
| **Username** | `/^[A-Za-z0-9_]+$/` | "Username should contain only letters, numbers, or underscores" |
| **Role** | Not empty | "Role is required" |
| **Membership Type** | Not empty | "Membership Type is required" |
| **Region** | Not empty (if not Digital) | "Region is required" |
| **City** | Not empty (if Digital) | "City is required for Digital Membership" |
| **State** | Not empty (if Digital) | "State is required for Digital Membership" |
| **Country** | Not empty (if Digital) | "Country is required for Digital Membership" |

### Backend Validation

- **Duplicate Check**: Email, Mobile, Username must be unique
- **Role Validation**: Must be one of `["user", "core-member", "admin"]`
- **Membership Type Validation**: Must be from predefined list
- **Password Generation**: Auto-generated 12-character random password
- **Email Notification**: Credentials sent via email to new user

---

## Step-by-Step Guide

### Prerequisites
1. Admin must be logged in with valid JWT token
2. Backend server running on configured URL (`VITE_API_BASE_URL`)
3. `.env` file properly configured

### Steps to Create a User

#### **Step 1: Navigate to Users Page**
1. Open admin panel (usually `http://localhost:5173`)
2. Login with admin credentials
3. Click "Users" in the sidebar navigation

#### **Step 2: Open Add User Modal**
1. Click the "Add User" button (top right)
2. Modal form appears with empty fields

#### **Step 3: Fill Required Fields**

**For Core Member Example:**
```
First Name: Rajesh
Last Name: Patel
Email: rajesh.patel@example.com
Mobile: 9876543210
Membership Type: Core Membership
Role: core-member
Region: Select from dropdown (e.g., "Ahmedabad")
Referred By: (Optional) Select core member
Username: (Optional) rajesh_patel
```

**For Admin Example:**
```
First Name: Admin
Last Name: User
Email: admin.user@bizcivitas.com
Mobile: 9876543299
Membership Type: Core Membership
Role: admin
Region: Select from dropdown
```

**For Digital Member Example:**
```
First Name: Priya
Last Name: Shah
Email: priya.shah@example.com
Mobile: 9876543211
Membership Type: Digital Membership
Role: user
City: Mumbai
State: Maharashtra
Country: India
```

#### **Step 4: Submit Form**
1. Click "Add User" button at bottom of form
2. Form validation runs automatically
3. If validation passes, API request is sent
4. Success/error toast appears

#### **Step 5: Verify User Creation**
1. Modal closes on success
2. User table refreshes automatically
3. New user appears in the list
4. User receives email with login credentials

---

## Error Handling

### Common Errors and Solutions

#### **1. "This email is already registered in the system"**

**Cause**: Email already exists in database

**Solution**:
- Check if user already exists
- Use different email address
- Update existing user instead of creating new one

#### **2. "This mobile number is already registered in the system"**

**Cause**: Mobile number already exists in database

**Solution**:
- Verify mobile number is correct
- Use different mobile number
- Check existing user records

#### **3. "Please enter a valid 10-digit mobile number"**

**Cause**: Mobile number doesn't match `/^[0-9]{10}$/` pattern

**Solution**:
- Enter exactly 10 digits
- Don't include country code (+91)
- Don't include spaces or special characters

#### **4. "Role is required"**

**Cause**: Role dropdown not selected

**Solution**:
- Select one of: `user`, `core-member`, or `admin`

#### **5. "Region is required"**

**Cause**: Region not selected for non-Digital membership

**Solution**:
- Select region from dropdown
- OR change membership type to Digital

#### **6. Network/API Errors**

**Cause**: Backend not responding or wrong URL

**Solution**:
- Check backend server is running
- Verify `VITE_API_BASE_URL` in `.env`
- Check browser console for detailed errors

---

## Troubleshooting

### Form Not Submitting

**Check:**
1. All required fields filled
2. Validation errors cleared (red text below fields)
3. Browser console for JavaScript errors
4. Network tab for API call status

### API Returns 401 Unauthorized

**Issue**: Invalid or expired JWT token

**Solution**:
1. Logout and login again
2. Check `localStorage.getItem('token')` in browser console
3. Verify token is being sent in Authorization header

### API Returns 403 Forbidden

**Issue**: User doesn't have admin role

**Solution**:
1. Verify logged-in user has `role: "admin"`
2. Check backend authorization middleware
3. Contact super admin to grant permissions

### User Created but Email Not Sent

**Issue**: Email service configuration

**Solution**:
1. Check backend email service (Nodemailer) configuration
2. Verify SMTP credentials in backend `.env`
3. Check backend logs for email errors
4. Manually send credentials to user

### Dropdown Lists Empty

**Issue**: Regions or Core Members API failed

**Solution**:
1. Check backend `/regions/getallregions/` endpoint
2. Check backend `/core-members/` endpoint
3. Verify network requests in browser DevTools
4. Check backend server logs

---

## Code Reference

### Main Files

| File | Purpose |
|------|---------|
| `src/pages/user/user.tsx` | User management page with form |
| `src/api/api.tsx` | Axios instance with auth headers |
| `backend/src/controllers/user.controller.js` | User registration logic |
| `backend/src/routes/user.route.js` | User API routes |
| `backend/src/models/user.model.js` | User database schema |

### Key Functions

#### **Frontend (`user.tsx`)**

```typescript
// Add user function
const handleAddUser = async (e: React.FormEvent) => {
  // Line 346-426
  // Validates form, submits to API, handles errors
}

// Real-time validation
const validateRealTime = () => {
  // Line 256-339
  // Validates fields as user types
}

// Duplicate error handling
const handleDuplicateKeyErrors = (error: any) => {
  // Line 230-254
  // Shows specific errors for duplicate email/mobile/username
}
```

#### **Backend (`user.controller.js`)**

```javascript
// Register user endpoint
const registerUser = asyncHandler(async (req, res) => {
  // Creates user, generates password, sends email
});
```

---

## Testing Checklist

Before deploying, test these scenarios:

### User Creation Tests

- [ ] Create user with role: `user`
- [ ] Create user with role: `core-member`
- [ ] Create user with role: `admin`
- [ ] Create Core Membership user
- [ ] Create Flagship Membership user
- [ ] Create Industria Membership user
- [ ] Create Digital Membership user
- [ ] Create Digital Membership Trial user

### Validation Tests

- [ ] Submit empty form (all required field errors should show)
- [ ] Enter invalid email format
- [ ] Enter 9-digit mobile number
- [ ] Enter mobile with spaces/dashes
- [ ] Enter first name with numbers
- [ ] Enter username with special characters
- [ ] Try duplicate email
- [ ] Try duplicate mobile
- [ ] Try duplicate username

### Location Tests

- [ ] Core Membership requires Region
- [ ] Digital Membership requires City/State/Country
- [ ] Digital Membership doesn't show Region field
- [ ] Non-Digital doesn't show City/State/Country fields

### Edge Cases

- [ ] Create user without last name (should work)
- [ ] Create user without username (auto-generated)
- [ ] Create user without referBy (should work)
- [ ] Network timeout handling
- [ ] Backend offline error handling

---

## Security Notes

### Authentication
- Only users with `role: "admin"` can access user creation
- JWT token required for all API calls
- Token stored in `localStorage` as `token`

### Password Management
- Passwords auto-generated (12 characters)
- Sent via email only (not displayed in UI)
- Users must change on first login
- `isPasswordTemp: true` flag set for new users

### Data Privacy
- Sensitive data not logged to console
- API responses don't include passwords
- Email addresses validated before storage

---

## Future Enhancements

### Planned Features
1. Bulk user upload via CSV
2. Role-based field visibility
3. Community assignment during creation
4. Payment tracking integration
5. User activity audit log
6. Custom email template editor

---

## Support

### Getting Help

**For Technical Issues**:
- Check browser console (F12)
- Review backend server logs
- Verify `.env` configuration

**For User Management Questions**:
- Contact system administrator
- Review user roles documentation

**For API Issues**:
- Check backend API documentation
- Verify JWT token validity
- Test endpoints with Postman/Thunder Client

---

**Document Version**: 1.0
**Last Reviewed**: November 28, 2025
**Maintained By**: BizCivitas Development Team

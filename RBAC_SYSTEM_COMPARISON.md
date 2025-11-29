# RBAC System Comparison - Backend vs Admin Panel

**Date**: November 29, 2025
**Purpose**: Compare and align RBAC implementation between backend and admin panel

---

## 🔍 Current Situation

### Backend RBAC Implementation

The backend uses a **simplified, single-role system** stored directly in the User model:

#### **User Model** (`user.model.js`)
```javascript
role: {
  type: String,
  enum: roles,  // From constants.js
  required: true,
  default: "user",
  trim: true
}
```

#### **Constants** (`constants.js`)
```javascript
export const roles = [
  "user",                    // Default role for all registered users
  "digital-member",          // Digital-only participants (short: DM)
  "core-member",             // Non-leader group members (short: Core)
  "pioneer",                 // Special recognition role
  "dcp",                     // Digital Channel Partner (manages digital members)
  "cgc",                     // Core Group Council (group leaders)
  "area-franchise",          // Area Partner (manages areas) (short: AF)
  "master-franchise",        // City-level franchise (manages city) (short: MF)
  "super-admin"              // Full system access (short: SA)
];

export const roleHierarchy = {
  "user": 0,
  "digital-member": 1,
  "core-member": 2,
  "pioneer": 3,
  "dcp": 4,
  "cgc": 5,
  "area-franchise": 6,
  "master-franchise": 7,
  "super-admin": 8
};
```

#### **RBAC Middleware** (`rbac.middleware.js`)

**Key Functions**:
1. `requireRole(...allowedRoles)` - Checks if user has any of the specified roles
2. `requireMinRole(minRole)` - Checks if user's role level >= minimum level
3. `requireScope(scopeType)` - Checks zone/area/community assignment
4. `requirePermission(action, resource)` - Permission matrix-based checks
5. `canManageUser()` - Hierarchical user management checks

**Permission Matrix** (hardcoded in middleware):
```javascript
const permissionMatrix = {
  "super-admin": {
    "*": ["create", "read", "update", "delete", "manage"]
  },
  "master-franchise": {
    "area": ["create", "read", "update", "delete"],
    "dcp": ["create", "read", "update", "delete", "assign"],
    "core-member": ["read", "assign"],
    "digital-member": ["read"],
    "city": ["read", "update"],
    "coregroup": ["read"],
    "user": ["read", "update"]
  },
  "area-franchise": {
    "dcp": ["create", "read", "update", "assign"],
    "core-member": ["create", "read", "update", "assign"],
    "digital-member": ["read", "assign"],
    "area": ["read", "update"],
    "coregroup": ["read"],
    "user": ["read", "update"]
  },
  "cgc": {
    "coregroup": ["create", "read", "update", "delete"],
    "core-member": ["read", "update", "invite"],
    "flagship-referral": ["create", "read", "update"],
    "user": ["read"]
  },
  "dcp": {
    "digital-member": ["create", "read", "update", "invite"],
    "user": ["read"]
  },
  "core-member": {
    "referral": ["create", "read"],
    "tyfcb": ["create", "read"],
    "meetup": ["create", "read"],
    "user": ["read"]
  },
  "digital-member": {
    "referral": ["create", "read"],
    "user": ["read"]
  },
  "pioneer": {
    "referral": ["create", "read"],
    "tyfcb": ["create", "read"],
    "user": ["read"]
  }
};
```

---

### Admin Panel RBAC API (Current - INCORRECT)

**File**: `src/api/rbacApi.ts`

**Current Implementation**:
```typescript
export interface Role {
  _id: string;
  name: string; // e.g., 'admin', 'editor', 'viewer'
  description?: string;
  permissions: Permission[];  // ❌ WRONG - Backend doesn't have this
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Functions:
- getAllRoles()           → GET /rbac/roles       ❌ Doesn't exist in backend
- getRoleById(id)         → GET /rbac/roles/:id   ❌ Doesn't exist
- createRole(data)        → POST /rbac/roles      ❌ Doesn't exist
- updateRole(id, data)    → PATCH /rbac/roles/:id ❌ Doesn't exist
- deleteRole(id)          → DELETE /rbac/roles/:id ❌ Doesn't exist
- getAllPermissions()     → GET /rbac/permissions ❌ Doesn't exist
- assignRoleToUser()      → POST /rbac/users/:userId/assign ❌ Doesn't exist
```

**Issues**:
- ❌ Assumes a **dynamic role-permission system** (like Laravel or Django)
- ❌ All API endpoints are **non-existent** in backend
- ❌ Uses `permissions` array which doesn't exist in backend
- ❌ Tries to create/update/delete roles dynamically (backend roles are static in constants)

---

## ✅ Correct RBAC Implementation

### Backend Architecture

**Role System**: **Static, enum-based** (not database-driven)
- Roles are defined in `constants.js`
- Cannot be created/updated/deleted via API
- User has single `role` field (not array)
- Permission matrix is hardcoded in middleware

**Access Control**:
1. **Role-based**: User's role determines base permissions
2. **Hierarchy-based**: Higher roles can manage lower roles
3. **Scope-based**: Geographic assignment (zone/area) restricts access
4. **Permission-based**: Permission matrix defines action-resource pairs

---

## 🔧 Required Changes to Admin Panel

### 1. Update `rbacApi.ts` to Match Backend

**New Implementation**:

```typescript
import api from './api';

// Role types matching backend constants
export type UserRole =
  | 'user'
  | 'digital-member'
  | 'core-member'
  | 'pioneer'
  | 'dcp'
  | 'cgc'
  | 'area-franchise'
  | 'master-franchise'
  | 'super-admin';

// Role hierarchy levels
export const roleHierarchy: Record<UserRole, number> = {
  'user': 0,
  'digital-member': 1,
  'core-member': 2,
  'pioneer': 3,
  'dcp': 4,
  'cgc': 5,
  'area-franchise': 6,
  'master-franchise': 7,
  'super-admin': 8
};

// Role display names and descriptions
export const roleInfo: Record<UserRole, { name: string; shortName: string; description: string }> = {
  'user': {
    name: 'User',
    shortName: 'User',
    description: 'Default registered user'
  },
  'digital-member': {
    name: 'Digital Member',
    shortName: 'DM',
    description: 'Digital-only participant'
  },
  'core-member': {
    name: 'Core Member',
    shortName: 'Core',
    description: 'Flagship member, attends physical meetups'
  },
  'pioneer': {
    name: 'Pioneer',
    shortName: 'Pioneer',
    description: 'Special recognition role'
  },
  'dcp': {
    name: 'Digital Chapter Partner',
    shortName: 'DCP',
    description: 'Manages digital members'
  },
  'cgc': {
    name: 'Core Group Council',
    shortName: 'CGC',
    description: '3+ leaders of a Core Group'
  },
  'area-franchise': {
    name: 'Area Franchise',
    shortName: 'AF',
    description: 'Manages specific Area within Zone'
  },
  'master-franchise': {
    name: 'Master Franchise',
    shortName: 'MF',
    description: 'Manages entire Zone (city)'
  },
  'super-admin': {
    name: 'Super Admin',
    shortName: 'SA',
    description: 'Full system access'
  }
};

// Get all available roles (static list from constants)
export const getAllRoles = (): UserRole[] => {
  return Object.keys(roleHierarchy) as UserRole[];
};

// Get role display information
export const getRoleInfo = (role: UserRole) => {
  return roleInfo[role];
};

// Check if role1 is higher than role2 in hierarchy
export const isRoleHigher = (role1: UserRole, role2: UserRole): boolean => {
  return roleHierarchy[role1] > roleHierarchy[role2];
};

// Check if role1 is higher than or equal to role2
export const isRoleHigherOrEqual = (role1: UserRole, role2: UserRole): boolean => {
  return roleHierarchy[role1] >= roleHierarchy[role2];
};

// Get roles that a given role can manage (lower in hierarchy)
export const getManageableRoles = (role: UserRole): UserRole[] => {
  const currentLevel = roleHierarchy[role];
  return getAllRoles().filter(r => roleHierarchy[r] < currentLevel);
};

// Update user role (via user management API, not RBAC API)
export const updateUserRole = async (userId: string, newRole: UserRole) => {
  const response = await api.patch(`/users/${userId}`, { role: newRole });
  return response.data;
};

// Get users by role (via user management API)
export const getUsersByRole = async (role: UserRole) => {
  const response = await api.get('/users', { params: { role } });
  return response.data;
};
```

---

### 2. Permission Matrix (Client-Side Helper)

**File**: `src/utils/permissions.ts`

```typescript
import { UserRole } from '../api/rbacApi';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign' | 'invite';
export type Resource =
  | 'area' | 'zone' | 'dcp' | 'core-member' | 'digital-member'
  | 'city' | 'coregroup' | 'user' | 'referral' | 'tyfcb'
  | 'meetup' | 'flagship-referral' | 'commission' | 'payout';

// Permission matrix matching backend
const permissionMatrix: Record<UserRole, Record<Resource | '*', Action[]>> = {
  'super-admin': {
    '*': ['create', 'read', 'update', 'delete', 'manage']
  },
  'master-franchise': {
    'area': ['create', 'read', 'update', 'delete'],
    'dcp': ['create', 'read', 'update', 'delete', 'assign'],
    'core-member': ['read', 'assign'],
    'digital-member': ['read'],
    'city': ['read', 'update'],
    'coregroup': ['read'],
    'user': ['read', 'update']
  },
  'area-franchise': {
    'dcp': ['create', 'read', 'update', 'assign'],
    'core-member': ['create', 'read', 'update', 'assign'],
    'digital-member': ['read', 'assign'],
    'area': ['read', 'update'],
    'coregroup': ['read'],
    'user': ['read', 'update']
  },
  'cgc': {
    'coregroup': ['create', 'read', 'update', 'delete'],
    'core-member': ['read', 'update', 'invite'],
    'flagship-referral': ['create', 'read', 'update'],
    'user': ['read']
  },
  'dcp': {
    'digital-member': ['create', 'read', 'update', 'invite'],
    'user': ['read']
  },
  'core-member': {
    'referral': ['create', 'read'],
    'tyfcb': ['create', 'read'],
    'meetup': ['create', 'read'],
    'user': ['read']
  },
  'digital-member': {
    'referral': ['create', 'read'],
    'user': ['read']
  },
  'pioneer': {
    'referral': ['create', 'read'],
    'tyfcb': ['create', 'read'],
    'user': ['read']
  },
  'user': {} // No special permissions
};

/**
 * Check if a role has permission to perform an action on a resource
 */
export const hasPermission = (
  userRole: UserRole,
  action: Action,
  resource: Resource
): boolean => {
  // Super admin has all permissions
  if (userRole === 'super-admin') {
    return true;
  }

  const rolePermissions = permissionMatrix[userRole];
  if (!rolePermissions) return false;

  // Check wildcard permission
  if (rolePermissions['*']?.includes(action)) {
    return true;
  }

  // Check specific resource permission
  if (rolePermissions[resource]?.includes(action)) {
    return true;
  }

  return false;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Record<Resource, Action[]> => {
  if (role === 'super-admin') {
    return { '*': ['create', 'read', 'update', 'delete', 'manage'] } as any;
  }
  return permissionMatrix[role] as any;
};
```

---

### 3. RBAC Components for Admin Panel

**File**: `src/components/RBAC/RoleSelector.tsx`

```typescript
import React from 'react';
import { Select } from '../shared';
import { UserRole, roleInfo, getAllRoles } from '../../api/rbacApi';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  currentUserRole?: UserRole;
  disabled?: boolean;
  showOnlyLower?: boolean; // Only show roles lower than current user
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  currentUserRole,
  disabled = false,
  showOnlyLower = true
}) => {
  const allRoles = getAllRoles();

  const availableRoles = showOnlyLower && currentUserRole
    ? allRoles.filter(role => {
        const currentLevel = roleHierarchy[currentUserRole];
        const roleLevel = roleHierarchy[role];
        return roleLevel < currentLevel;
      })
    : allRoles;

  const options = availableRoles.map(role => ({
    value: role,
    label: `${roleInfo[role].name} (${roleInfo[role].shortName})`
  }));

  return (
    <Select
      label="User Role"
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      disabled={disabled}
    />
  );
};
```

**File**: `src/components/RBAC/RoleBadge.tsx`

```typescript
import React from 'react';
import { Badge } from '../shared';
import { UserRole, roleInfo } from '../../api/rbacApi';

interface RoleBadgeProps {
  role: UserRole;
  showFull?: boolean; // Show full name or short name
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showFull = false }) => {
  const info = roleInfo[role];

  const variantMap: Record<UserRole, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    'super-admin': 'danger',
    'master-franchise': 'success',
    'area-franchise': 'success',
    'cgc': 'info',
    'dcp': 'info',
    'core-member': 'warning',
    'digital-member': 'warning',
    'pioneer': 'info',
    'user': 'default'
  };

  return (
    <Badge variant={variantMap[role]}>
      {showFull ? info.name : info.shortName}
    </Badge>
  );
};
```

**File**: `src/components/RBAC/PermissionGuard.tsx`

```typescript
import React from 'react';
import { UserRole } from '../../api/rbacApi';
import { hasPermission, Action, Resource } from '../../utils/permissions';

interface PermissionGuardProps {
  userRole: UserRole;
  action: Action;
  resource: Resource;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  userRole,
  action,
  resource,
  children,
  fallback = null
}) => {
  const allowed = hasPermission(userRole, action, resource);
  return <>{allowed ? children : fallback}</>;
};
```

---

## 📋 Summary of Changes Needed

### ✅ Files to Update

1. **`src/api/rbacApi.ts`** - Complete rewrite
   - Remove dynamic role CRUD operations
   - Add static role constants
   - Add role hierarchy helpers
   - Add role info (names, descriptions, short names)

2. **Create `src/utils/permissions.ts`**
   - Permission matrix matching backend
   - Permission checking helpers

3. **Create `src/components/RBAC/RoleSelector.tsx`**
   - Dropdown for role selection
   - Shows only manageable roles based on current user

4. **Create `src/components/RBAC/RoleBadge.tsx`**
   - Display role with appropriate badge color
   - Show short name (MF, AF, CGC, DCP, etc.)

5. **Create `src/components/RBAC/PermissionGuard.tsx`**
   - Conditional rendering based on permissions
   - Useful for hiding/showing UI elements

6. **Create `src/components/RBAC/index.ts`**
   - Export all RBAC components

---

## 🔑 Key Differences

| Aspect | Backend | Old Admin Panel | New Admin Panel |
|--------|---------|----------------|-----------------|
| Role Storage | Static enum in constants | Dynamic DB (assumed) | Static enum matching backend |
| Role CRUD | Not possible | API endpoints (don't exist) | Read-only constants |
| Permissions | Hardcoded matrix | Dynamic permissions (don't exist) | Hardcoded matrix matching backend |
| User Roles | Single `role` field | `roles` array (incorrect) | Single `role` field |
| API Endpoints | None for RBAC | `/rbac/*` (don't exist) | Use `/users/*` for role updates |

---

## 🎯 Short Forms Reference

| Full Name | Short Form | Description |
|-----------|-----------|-------------|
| Super Admin | **SA** | Full system access |
| Master Franchise | **MF** | Manages Zone (city) |
| Area Franchise | **AF** | Manages Area (locality) |
| Core Group Council | **CGC** | 3+ leaders of Core Group |
| Digital Chapter Partner | **DCP** | Manages digital members |
| Core Member | **Core** | Flagship physical member |
| Digital Member | **DM** | Digital-only member |
| Pioneer | **Pioneer** | Special recognition |
| User | **User** | Default registered user |

---

**Last Updated**: November 29, 2025
**Status**: Comparison complete, updates needed in admin panel

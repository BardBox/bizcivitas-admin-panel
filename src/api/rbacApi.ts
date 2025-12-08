import api from './api';

// ========================================
// RBAC API - Matching Backend Implementation
// ========================================

/**
 * Role types matching backend constants.js
 * These are static enums, NOT database-driven roles
 */
export type UserRole =
  | 'user'
  | 'digital-member'
  | 'core-member'
  | 'pioneer'
  | 'dcp'
  | 'cgc'
  | 'area-franchise'
  | 'master-franchise'
  | 'admin';

/**
 * Role hierarchy levels (matching backend)
 * Higher number = higher authority
 */
export const roleHierarchy: Record<UserRole, number> = {
  'user': 0,
  'digital-member': 1,
  'core-member': 2,
  'pioneer': 3,
  'dcp': 4,
  'cgc': 5,
  'area-franchise': 6,
  'master-franchise': 7,
  'admin': 8
};

/**
 * Role display information with short names
 */
export const roleInfo: Record<UserRole, { name: string; shortName: string; description: string }> = {
  'user': {
    name: 'User',
    shortName: 'User',
    description: 'Default registered user'
  },
  'digital-member': {
    name: 'Digital Member',
    shortName: 'DM',
    description: 'Digital-only participant, online networking'
  },
  'core-member': {
    name: 'Core Member',
    shortName: 'Core',
    description: 'Flagship member, attends physical meetups'
  },
  'pioneer': {
    name: 'Pioneer',
    shortName: 'Pioneer',
    description: 'Special recognition role for early adopters'
  },
  'dcp': {
    name: 'Digital Chapter Partner',
    shortName: 'DCP',
    description: 'Manages digital members, recruits DMs'
  },
  'cgc': {
    name: 'Core Group Council',
    shortName: 'CGC',
    description: '3+ leaders of a Core Group'
  },
  'area-franchise': {
    name: 'Area Franchise',
    shortName: 'AF',
    description: 'Manages specific Area within Zone, hired by MF'
  },
  'master-franchise': {
    name: 'Master Franchise',
    shortName: 'MF',
    description: 'Manages entire Zone (city), creates Areas, hires AFs'
  },
  'admin': {
    name: 'Admin',
    shortName: 'SA',
    description: 'Full system access, platform administrator'
  }
};

// ========================================
// ROLE HELPER FUNCTIONS
// ========================================

/**
 * Get all available roles (static list from constants)
 */
export const getAllRoles = (): UserRole[] => {
  return Object.keys(roleHierarchy) as UserRole[];
};

/**
 * Get role display information
 */
export const getRoleInfo = (role: UserRole) => {
  return roleInfo[role];
};

/**
 * Check if role1 is higher than role2 in hierarchy
 */
export const isRoleHigher = (role1: UserRole, role2: UserRole): boolean => {
  return roleHierarchy[role1] > roleHierarchy[role2];
};

/**
 * Check if role1 is higher than or equal to role2
 */
export const isRoleHigherOrEqual = (role1: UserRole, role2: UserRole): boolean => {
  return roleHierarchy[role1] >= roleHierarchy[role2];
};

/**
 * Get roles that a given role can manage (lower in hierarchy)
 */
export const getManageableRoles = (role: UserRole): UserRole[] => {
  const currentLevel = roleHierarchy[role];
  return getAllRoles().filter(r => roleHierarchy[r] < currentLevel);
};

/**
 * Get role level (hierarchy number)
 */
export const getRoleLevel = (role: UserRole): number => {
  return roleHierarchy[role];
};

/**
 * Format role for display (with short name in parentheses)
 */
export const formatRoleDisplay = (role: UserRole, useShortName = false): string => {
  const info = roleInfo[role];
  return useShortName ? info.shortName : `${info.name} (${info.shortName})`;
};

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Update user role
 * Uses user management API, not a dedicated RBAC API
 * Backend endpoint: PATCH /api/v1/users/:id
 */
export const updateUserRole = async (userId: string, newRole: UserRole) => {
  const response = await api.patch(`/users/${userId}`, { role: newRole });
  return response.data;
};

/**
 * Get users by role
 * Backend endpoint: GET /api/v1/users?role=<role>
 */
export const getUsersByRole = async (role: UserRole, params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const response = await api.get('/users', {
    params: { role, ...params }
  });
  return response.data;
};

/**
 * Get all users in a specific business area (for area franchises)
 * Backend endpoint: GET /api/v1/users/getallusers?businessArea=<areaName>
 */
export const getUsersByArea = async (businessArea: string) => {
  const response = await api.get('/users/getallusers', {
    params: { businessArea }
  });
  return response.data;
};

/**
 * Get user's role and permissions
 * Backend endpoint: GET /api/v1/users/:id
 */
export const getUserRole = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return {
    role: response.data.data.role as UserRole,
    roleInfo: roleInfo[response.data.data.role as UserRole]
  };
};

// ========================================
// LEGACY INTERFACES (for backward compatibility)
// ========================================

/**
 * @deprecated Use UserRole type instead
 * This interface is kept for backward compatibility with existing code
 */
export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * @deprecated Permissions are now hardcoded in permissionMatrix
 */
export interface Permission {
  _id: string;
  name: string;
  description: string;
  module: string;
}

/**
 * @deprecated Not used in new implementation
 */
export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds: string[];
}

/**
 * @deprecated Not used in new implementation
 */
export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

import api from './api';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface CommissionDistribution {
  superAdmin: number;
  masterFranchise: number;
  areaFranchise: number;
  finalRecipient: number;
}

export interface CommissionConfig {
  _id: string;
  membershipType: 'Core Membership' | 'Flagship Membership' | 'Industria Membership' | 'Digital Membership';
  totalPoolPercentage: number;
  distribution: CommissionDistribution;
  isActive: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommissionConfigData {
  membershipType: string;
  totalPoolPercentage: number;
  distribution: {
    superAdmin: number;
    masterFranchise: number;
    areaFranchise: number;
    finalRecipient: number;
  };
  notes?: string;
}

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Get all commission configurations
 */
export const getAllCommissionConfigs = async (): Promise<CommissionConfig[]> => {
  const response = await api.get('/commission-config');
  return response.data.data;
};

/**
 * Get commission config by membership type
 */
export const getCommissionConfigByType = async (
  membershipType: string
): Promise<CommissionConfig> => {
  const response = await api.get(`/commission-config/${membershipType}`);
  return response.data.data;
};

/**
 * Create or update commission configuration
 */
export const createOrUpdateCommissionConfig = async (
  data: CreateCommissionConfigData
): Promise<CommissionConfig> => {
  const response = await api.post('/commission-config', data);
  return response.data.data;
};

/**
 * Delete commission configuration
 */
export const deleteCommissionConfig = async (id: string): Promise<void> => {
  await api.delete(`/commission-config/${id}`);
};

/**
 * Reset commission config to default values
 */
export const resetCommissionConfigToDefaults = async (
  membershipType: string
): Promise<CommissionConfig> => {
  const response = await api.post(`/commission-config/reset/${membershipType}`);
  return response.data.data;
};

// ========================================
// CONSTANTS
// ========================================

export const MEMBERSHIP_TYPES = [
  'Core Membership',
  'Flagship Membership',
  'Industria Membership',
  'Digital Membership'
] as const;

export const DEFAULT_CONFIGS: Record<string, Omit<CommissionConfig, '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy' | 'isActive'>> = {
  'Flagship Membership': {
    membershipType: 'Flagship Membership',
    totalPoolPercentage: 12,
    distribution: {
      superAdmin: 0,
      masterFranchise: 12,
      areaFranchise: 7,
      finalRecipient: 4
    },
    notes: 'Default configuration for Flagship membership'
  },
  'Digital Membership': {
    membershipType: 'Digital Membership',
    totalPoolPercentage: 40,
    distribution: {
      superAdmin: 0,
      masterFranchise: 40,
      areaFranchise: 30,
      finalRecipient: 20
    },
    notes: 'Default configuration for Digital membership'
  },
  'Core Membership': {
    membershipType: 'Core Membership',
    totalPoolPercentage: 12,
    distribution: {
      superAdmin: 0,
      masterFranchise: 12,
      areaFranchise: 7,
      finalRecipient: 4
    },
    notes: 'Default configuration for Core membership'
  },
  'Industria Membership': {
    membershipType: 'Industria Membership',
    totalPoolPercentage: 15,
    distribution: {
      superAdmin: 0,
      masterFranchise: 15,
      areaFranchise: 10,
      finalRecipient: 5
    },
    notes: 'Default configuration for Industria membership'
  }
};

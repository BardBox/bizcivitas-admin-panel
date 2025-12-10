import api from './api';

export interface Zone {
  _id: string;
  zoneId: string;
  countryId: string;
  stateId: string;
  cities: string[]; // Array of city names in this zone
  cityId: string; // Deprecated: kept for backward compatibility
  zoneName: string;
  assignedMFId?: {
    _id: string;
    fname: string;
    lname?: string;
    email: string;
    phoneNumber?: string;
  };
  status: 'pending' | 'active' | 'inactive';
  maxAreas?: number;
  areas: string[];
  createdBy: string;
  notes?: string;
  metadata?: {
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    timezone?: string;
    areaCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneData {
  countryId: string;
  stateId: string;
  cities: string[]; // Array of city names
  cityId?: string; // Deprecated: kept for backward compatibility
  zoneName: string;
  maxAreas?: number;
  notes?: string;
  metadata?: {
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    timezone?: string;
  };
}

export interface UpdateZoneData {
  zoneName?: string;
  cities?: string[]; // Can update cities array
  maxAreas?: number;
  status?: 'pending' | 'active' | 'inactive';
  notes?: string;
  metadata?: any;
}

export interface ZoneStats {
  zone: {
    id: string;
    name: string;
    cities: string[]; // Array of cities
    city: string; // Deprecated: backward compatibility
    state: string;
    country: string;
    status: string;
  };
  areas: {
    total: number;
    active: number;
    maxAllowed?: number;
  };
  users: {
    total: number;
    byRole: Array<{ _id: string; count: number }>;
  };
  performance?: any;
}

// Create new zone
export const createZone = async (data: CreateZoneData) => {
  const response = await api.post('/zones', data);
  return response.data.data;
};

// Get all zones
export const getAllZones = async (params?: {
  countryId?: string;
  stateId?: string;
  status?: string;
  assignedMFId?: string;
}) => {
  const response = await api.get('/zones', { params });
  return response.data.data.zones;
};

// Get zones dropdown
export const getZonesDropdown = async (active?: boolean) => {
  const response = await api.get('/zones/dropdown', {
    params: { active: active ? 'true' : undefined }
  });
  return response.data.data;
};

// Get zone by ID
export const getZoneById = async (id: string) => {
  const response = await api.get(`/zones/${id}`);
  return response.data.data;
};

// Update zone
export const updateZone = async (id: string, data: UpdateZoneData) => {
  const response = await api.patch(`/zones/${id}`, data);
  return response.data.data;
};

// Assign Master Franchise to zone
export const assignMasterFranchise = async (zoneId: string, masterFranchiseId: string) => {
  const response = await api.post(`/zones/${zoneId}/assign-mf`, { masterFranchiseId });
  return response.data.data;
};

// Unassign Master Franchise from zone
export const unassignMasterFranchise = async (zoneId: string) => {
  const response = await api.post(`/zones/${zoneId}/unassign-mf`);
  return response.data.data;
};

// Delete zone
export const deleteZone = async (id: string) => {
  const response = await api.delete(`/zones/${id}`);
  return response.data.data;
};

// Get zone statistics
export const getZoneStats = async (id: string): Promise<ZoneStats> => {
  const response = await api.get(`/zones/${id}/stats`);
  return response.data.data;
};

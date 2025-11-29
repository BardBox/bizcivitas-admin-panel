import api from './api';

export interface Area {
  _id: string;
  areaName: string;
  areaCode: string;
  zoneId: {
    _id: string;
    zoneName: string;
    cityId: string;
    stateId: string;
    countryId: string;
  };
  areaFranchise?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    businessCategory?: string;
  };
  dcps: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  coreGroups: string[];
  boundaries?: {
    coordinates?: number[][];
    description?: string;
  };
  status: 'active' | 'inactive';
  metadata?: {
    pinCodes?: string[];
    landmarks?: string[];
    population?: number;
  };
  capacity?: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaData {
  areaName: string;
  capacity?: number;
  boundaries?: {
    coordinates?: number[][];
    description?: string;
  };
  metadata?: {
    pinCodes?: string[];
    landmarks?: string[];
    population?: number;
  };
}

export interface UpdateAreaData {
  areaName?: string;
  capacity?: number;
  status?: 'active' | 'inactive';
  boundaries?: any;
  metadata?: any;
}

export interface AreaStats {
  area: {
    id: string;
    name: string;
    code: string;
    zone: any;
    status: string;
  };
  coreGroups: {
    total: number;
    active: number;
  };
  dcps: {
    total: number;
  };
  users: {
    total: number;
    byRole: Array<{ _id: string; count: number }>;
  };
  performance?: any;
}

// Create area in a zone (backend: POST /api/v1/zones/:zoneId/areas)
export const createArea = async (zoneId: string, data: CreateAreaData) => {
  const response = await api.post(`/zones/${zoneId}/areas`, data);
  return response.data.data;
};

// Get areas by zone (backend: GET /api/v1/zones/:zoneId/areas)
export const getAreasByZone = async (zoneId: string, status?: string) => {
  const response = await api.get(`/zones/${zoneId}/areas`, {
    params: { status }
  });
  return response.data.data.areas;
};

// Get all areas (backend: GET /api/v1/areas)
export const getAllAreas = async (params?: {
  status?: string;
  zoneId?: string;
}) => {
  const response = await api.get('/areas', { params });
  return response.data.data.areas;
};

// Get areas dropdown (backend: GET /api/v1/areas/dropdown)
export const getAreasDropdown = async (zoneId?: string, active?: boolean) => {
  const response = await api.get('/areas/dropdown', {
    params: {
      zoneId,
      active: active ? 'true' : undefined
    }
  });
  return response.data.data;
};

// Get area by ID (backend: GET /api/v1/areas/:id)
export const getAreaById = async (id: string) => {
  const response = await api.get(`/areas/${id}`);
  return response.data.data;
};

// Update area (backend: PATCH /api/v1/areas/:id)
export const updateArea = async (id: string, data: UpdateAreaData) => {
  const response = await api.patch(`/areas/${id}`, data);
  return response.data.data;
};

// Assign Area Franchise (backend: POST /api/v1/areas/:id/assign-af)
export const assignAreaFranchise = async (areaId: string, areaFranchiseId: string) => {
  const response = await api.post(`/areas/${areaId}/assign-af`, { areaFranchiseId });
  return response.data.data;
};

// Unassign Area Franchise (backend: POST /api/v1/areas/:id/unassign-af)
export const unassignAreaFranchise = async (areaId: string) => {
  const response = await api.post(`/areas/${areaId}/unassign-af`);
  return response.data.data;
};

// Delete area (backend: DELETE /api/v1/areas/:id)
export const deleteArea = async (id: string) => {
  const response = await api.delete(`/areas/${id}`);
  return response.data.data;
};

// Get area statistics (backend: GET /api/v1/areas/:id/stats)
export const getAreaStats = async (id: string): Promise<AreaStats> => {
  const response = await api.get(`/areas/${id}/stats`);
  return response.data.data;
};

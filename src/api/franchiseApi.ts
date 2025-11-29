import api from './api';

export interface CreateFranchiseData {
  fname: string;
  lname?: string;
  email: string;
  mobile: string;
  role: 'master-franchise' | 'area-franchise' | 'cgc' | 'dcp';
  password: string;
  zoneId?: string;  // Required for master-franchise
  areaId?: string;  // Required for area-franchise
  city?: string;
  state?: string;
  country?: string;
}

export interface FranchiseUser {
  _id: string;
  fname: string;
  lname?: string;
  username: string;
  email: string;
  mobile: string;
  role: string;
  membershipType: string;
  isActive: boolean;
  country?: string;
  state?: string;
  city?: string;
  zoneId?: string;
  areaId?: string;
  createdAt: string;
}

/**
 * Create a new franchise partner (MF, AF, CGC, DCP)
 * POST /api/v1/franchise-partners/create
 */
export const createFranchiseUser = async (data: CreateFranchiseData): Promise<FranchiseUser> => {
  const response = await api.post('/franchise-partners/create', data);
  return response.data.data.partner;
};

/**
 * Get franchise partners by role
 * GET /api/v1/franchise-partners?role=master-franchise
 */
export const getUsersByRole = async (role: string): Promise<FranchiseUser[]> => {
  const response = await api.get('/franchise-partners', {
    params: { role }
  });
  return response.data.data;
};

/**
 * Update franchise partner
 * PATCH /api/v1/franchise-partners/:id
 */
export const updateFranchiseUser = async (id: string, data: Partial<CreateFranchiseData>): Promise<FranchiseUser> => {
  const response = await api.patch(`/franchise-partners/${id}`, data);
  return response.data.data.partner;
};

/**
 * Delete franchise partner
 * DELETE /api/v1/franchise-partners/:id
 */
export const deleteFranchiseUser = async (id: string): Promise<void> => {
  await api.delete(`/franchise-partners/${id}`);
};

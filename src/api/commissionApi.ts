import api from './api';

// Commission Interface matching backend structure
export interface Commission {
  _id: string;
  sourceMember: {
    _id: string;
    name: string;
    email: string;
    businessCategory?: string;
    membershipType?: string;
  };
  membershipType: 'flagship' | 'digital';
  baseAmount: number;
  totalCommissionPool: number;
  distribution: {
    sa: {
      userId?: string;
      percentage: number;
      amount: number;
      status: 'pending' | 'done';
    };
    mf: {
      userId?: {
        _id: string;
        name: string;
        email: string;
      };
      percentage: number;
      amount: number;
      status: 'pending' | 'done';
    };
    af: {
      userId?: {
        _id: string;
        name: string;
        email: string;
      };
      percentage: number;
      amount: number;
      status: 'pending' | 'done';
    };
    final: {
      userId?: {
        _id: string;
        name: string;
        email: string;
      };
      userType: 'core-member' | 'dcp';
      percentage: number;
      amount: number;
      status: 'pending' | 'done';
    };
  };
  transactionType: 'registration' | 'renewal' | 'upgrade';
  paymentId: {
    _id: string;
    amount: number;
    status: string;
    paymentMethod?: string;
    transactionId?: string;
  };
  overallStatus: 'pending' | 'partially_paid' | 'completed';
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalculateCommissionData {
  paymentId: string;
  sourceMemberId: string;
  transactionType?: 'registration' | 'renewal' | 'upgrade';
}

export interface CommissionSummary {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  earnings: {
    total: number;
    pending: number;
    paid: number;
  };
  commissions: {
    total: number;
    flagship: number;
    digital: number;
  };
  recentCommissions: Array<{
    id: string;
    amount: number;
    membershipType: string;
    status: string;
    date: string;
  }>;
}

export interface CommissionStats {
  flagship: {
    totalCommissions: number;
    totalAmount: number;
    pendingCount: number;
    completedCount: number;
  };
  digital: {
    totalCommissions: number;
    totalAmount: number;
    pendingCount: number;
    completedCount: number;
  };
  total: {
    totalCommissions: number;
    totalAmount: number;
    pendingCount: number;
    completedCount: number;
  };
}

// Calculate commission (backend: POST /api/v1/commissions/calculate)
export const calculateCommission = async (data: CalculateCommissionData) => {
  const response = await api.post('/commissions/calculate', data);
  return response.data;
};

// Get all commissions (backend: GET /api/v1/commissions)
export const getAllCommissions = async (params?: {
  membershipType?: 'flagship' | 'digital';
  overallStatus?: 'pending' | 'partially_paid' | 'completed';
  startDate?: string;
  endDate?: string;
  sourceMember?: string;
  userId?: string;
}) => {
  const response = await api.get('/commissions', { params });
  return response.data;
};

// Get commission statistics (backend: GET /api/v1/commissions/stats)
export const getCommissionStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ data: CommissionStats }> => {
  const response = await api.get('/commissions/stats', { params });
  return response.data;
};

// Get commission by ID (backend: GET /api/v1/commissions/:id)
export const getCommissionById = async (id: string) => {
  const response = await api.get(`/commissions/${id}`);
  return response.data;
};

// Get user commission summary (backend: GET /api/v1/commissions/user/:userId/summary)
export const getUserCommissionSummary = async (userId: string): Promise<{ data: CommissionSummary }> => {
  const response = await api.get(`/commissions/user/${userId}/summary`);
  return response.data;
};

// Mark commission as paid (backend: PATCH /api/v1/commissions/:id/mark-paid)
export const markCommissionAsPaid = async (
  id: string,
  data: {
    recipientType: 'mf' | 'af' | 'final';
    transactionId?: string;
  }
) => {
  const response = await api.patch(`/commissions/${id}/mark-paid`, data);
  return response.data;
};

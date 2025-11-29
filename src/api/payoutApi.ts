import api from './api';

// Payout Interface matching backend structure
export interface Payout {
  _id: string;
  recipient: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    businessCategory?: string;
  };
  recipientRole: 'admin' | 'master-franchise' | 'area-franchise' | 'cgc' | 'dcp' | 'core-member';
  amount: number;
  currency: string;
  payoutPeriod: {
    startDate: string;
    endDate: string;
  };
  status: 'pending' | 'processing' | 'done' | 'failed' | 'cancelled';
  commissions: string[]; // Commission IDs
  commissionCount: number;
  breakdown: {
    flagship: {
      amount: number;
      count: number;
    };
    digital: {
      amount: number;
      count: number;
    };
  };
  paymentDetails?: {
    method?: 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'wallet';
    transactionId?: string;
    transactionDate?: string;
    bankDetails?: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
    };
    upiId?: string;
    chequeNumber?: string;
    proofUrl?: string;
  };
  scheduledDate: string;
  paidDate?: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  initiatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  processedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  taxDetails: {
    tdsPercentage: number;
    tdsAmount: number;
    netAmount: number;
  };
  notes?: string;
  failureReason?: string;
  retryCount: number;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayoutData {
  recipientId: string;
  startDate: string;
  endDate: string;
  scheduledDate: string;
  tdsPercentage?: number;
}

export interface UpdatePayoutData {
  scheduledDate?: string;
  notes?: string;
  taxDetails?: {
    tdsPercentage?: number;
  };
}

export interface PaymentDetailsData {
  transactionId?: string;
  transactionDate?: string;
  method?: 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'wallet';
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  upiId?: string;
  chequeNumber?: string;
  proofUrl?: string;
}

export interface PayoutStats {
  pending: {
    amount: number;
    count: number;
  };
  done: {
    amount: number;
    count: number;
  };
  failed: {
    amount: number;
    count: number;
  };
}

// Create payout from pending commissions (backend: POST /api/v1/payouts/create)
export const createPayout = async (data: CreatePayoutData) => {
  const response = await api.post('/payouts/create', data);
  return response.data;
};

// Get all payouts (backend: GET /api/v1/payouts)
export const getAllPayouts = async (params?: {
  status?: 'pending' | 'processing' | 'done' | 'failed' | 'cancelled';
  recipientRole?: string;
  startDate?: string;
  endDate?: string;
  overdue?: boolean;
}) => {
  const response = await api.get('/payouts', { params });
  return response.data;
};

// Get pending payouts (backend: GET /api/v1/payouts/pending)
export const getPendingPayouts = async (params?: {
  recipientRole?: string;
  overdue?: boolean;
}) => {
  const response = await api.get('/payouts/pending', { params });
  return response.data;
};

// Get monthly payout summary (backend: GET /api/v1/payouts/summary/monthly)
export const getMonthlyPayoutSummary = async (year: number, month: number) => {
  const response = await api.get('/payouts/summary/monthly', {
    params: { year, month }
  });
  return response.data;
};

// Get user payout statistics (backend: GET /api/v1/payouts/user/:userId/stats)
export const getUserPayoutStats = async (userId: string): Promise<{ data: PayoutStats }> => {
  const response = await api.get(`/payouts/user/${userId}/stats`);
  return response.data;
};

// Get payout by ID (backend: GET /api/v1/payouts/:id)
export const getPayoutById = async (id: string) => {
  const response = await api.get(`/payouts/${id}`);
  return response.data;
};

// Update payout (backend: PATCH /api/v1/payouts/:id)
export const updatePayout = async (id: string, data: UpdatePayoutData) => {
  const response = await api.patch(`/payouts/${id}`, data);
  return response.data;
};

// Mark payout as processing (backend: PATCH /api/v1/payouts/:id/process)
export const markPayoutAsProcessing = async (id: string) => {
  const response = await api.patch(`/payouts/${id}/process`);
  return response.data;
};

// Mark payout as done (backend: PATCH /api/v1/payouts/:id/complete)
export const markPayoutAsDone = async (id: string, paymentDetails: PaymentDetailsData) => {
  const response = await api.patch(`/payouts/${id}/complete`, paymentDetails);
  return response.data;
};

// Mark payout as failed (backend: PATCH /api/v1/payouts/:id/fail)
export const markPayoutAsFailed = async (id: string, failureReason: string) => {
  const response = await api.patch(`/payouts/${id}/fail`, { failureReason });
  return response.data;
};

// Cancel payout (backend: DELETE /api/v1/payouts/:id)
export const cancelPayout = async (id: string, reason?: string) => {
  const response = await api.delete(`/payouts/${id}`, {
    data: { reason }
  });
  return response.data;
};

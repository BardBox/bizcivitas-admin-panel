import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Badge, Card, Breadcrumb, Select } from '../../components/shared';
import {
  getAllCommissions,
  getCommissionStats,
  Commission,
  CommissionStats
} from '../../api/commissionApi';
import { toast } from 'react-toastify';
import { FiDollarSign, FiTrendingUp, FiCheckCircle, FiClock } from 'react-icons/fi';

const CommissionDashboard: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filters
  const [membershipTypeFilter, setMembershipTypeFilter] = useState<'flagship' | 'digital' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'partially_paid' | 'completed' | ''>('');

  useEffect(() => {
    fetchData();
  }, [membershipTypeFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (membershipTypeFilter) params.membershipType = membershipTypeFilter;
      if (statusFilter) params.overallStatus = statusFilter;

      const [commissionsData, statsData] = await Promise.all([
        getAllCommissions(params),
        getCommissionStats()
      ]);

      setCommissions(commissionsData.data?.commissions || commissionsData.data || []);
      setStats(statsData.data);
    } catch (error: any) {
      console.error('Error fetching commissions:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (commission: Commission) => {
    setSelectedCommission(commission);
    setIsDetailsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning',
      partially_paid: 'info',
      completed: 'success'
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'sourceMember',
      label: 'Source Member',
      render: (commission: Commission) => (
        <div>
          <div className="font-medium">{commission.sourceMember.name}</div>
          <div className="text-xs text-gray-500">{commission.sourceMember.email}</div>
        </div>
      )
    },
    {
      key: 'membershipType',
      label: 'Type',
      render: (commission: Commission) => (
        <Badge variant={commission.membershipType === 'flagship' ? 'primary' : 'info'}>
          {commission.membershipType.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'totalCommissionPool',
      label: 'Total Pool',
      render: (commission: Commission) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(commission.totalCommissionPool)}
        </span>
      )
    },
    {
      key: 'baseAmount',
      label: 'Base Amount',
      render: (commission: Commission) => formatCurrency(commission.baseAmount)
    },
    {
      key: 'overallStatus',
      label: 'Status',
      render: (commission: Commission) => getStatusBadge(commission.overallStatus)
    },
    {
      key: 'calculatedAt',
      label: 'Date',
      render: (commission: Commission) => formatDate(commission.calculatedAt)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (commission: Commission) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(commission);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="p-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/finance/commissions' },
          { label: 'Commissions' }
        ]}
        className="mb-6"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total.totalCommissions}</p>
                <p className="text-sm text-green-600 mt-1">
                  {formatCurrency(stats.total.totalAmount)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiDollarSign className="text-blue-600 text-2xl" />
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagship</p>
                <p className="text-2xl font-bold text-gray-900">{stats.flagship.totalCommissions}</p>
                <p className="text-sm text-green-600 mt-1">
                  {formatCurrency(stats.flagship.totalAmount)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FiTrendingUp className="text-purple-600 text-2xl" />
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Digital</p>
                <p className="text-2xl font-bold text-gray-900">{stats.digital.totalCommissions}</p>
                <p className="text-sm text-green-600 mt-1">
                  {formatCurrency(stats.digital.totalAmount)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiCheckCircle className="text-green-600 text-2xl" />
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total.pendingCount}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Completed: {stats.total.completedCount}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiClock className="text-yellow-600 text-2xl" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Table */}
      <Card
        title="Commission Records"
        subtitle="View and manage all commission distributions"
        headerAction={
          <div className="flex gap-3">
            <Select
              options={[
                { value: '', label: 'All Types' },
                { value: 'flagship', label: 'Flagship' },
                { value: 'digital', label: 'Digital' }
              ]}
              value={membershipTypeFilter}
              onChange={(e) => setMembershipTypeFilter(e.target.value as any)}
              fullWidth={false}
              className="w-40"
            />
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'partially_paid', label: 'Partially Paid' },
                { value: 'completed', label: 'Completed' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              fullWidth={false}
              className="w-40"
            />
          </div>
        }
      >
        <Table
          columns={columns}
          data={commissions}
          loading={loading}
          onRowClick={handleViewDetails}
          emptyMessage="No commissions found"
        />
      </Card>

      {/* Commission Details Modal */}
      {selectedCommission && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Commission Details"
          size="xl"
        >
          <div className="space-y-6">
            {/* Source Member Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Source Member</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{selectedCommission.sourceMember.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{selectedCommission.sourceMember.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Membership:</span>
                  <span className="ml-2">
                    <Badge variant={selectedCommission.membershipType === 'flagship' ? 'primary' : 'info'}>
                      {selectedCommission.membershipType}
                    </Badge>
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2">{getStatusBadge(selectedCommission.overallStatus)}</span>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div>
              <h4 className="font-semibold mb-3">Amount Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Base Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedCommission.baseAmount)}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total Commission Pool</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedCommission.totalCommissionPool)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCommission.membershipType === 'flagship' ? '12%' : '40%'} of base
                  </p>
                </div>
              </div>
            </div>

            {/* Distribution Hierarchy */}
            <div>
              <h4 className="font-semibold mb-3">Commission Distribution</h4>
              <div className="space-y-3">
                {/* Master Franchise */}
                {selectedCommission.distribution.mf.userId && (
                  <div className="border border-gray-200 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Master Franchise</p>
                        <p className="text-xs text-gray-500">
                          {selectedCommission.distribution.mf.userId.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(selectedCommission.distribution.mf.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedCommission.distribution.mf.percentage}%
                        </p>
                        <Badge
                          variant={selectedCommission.distribution.mf.status === 'done' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {selectedCommission.distribution.mf.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Area Franchise */}
                {selectedCommission.distribution.af.userId && (
                  <div className="border border-gray-200 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Area Franchise</p>
                        <p className="text-xs text-gray-500">
                          {selectedCommission.distribution.af.userId.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(selectedCommission.distribution.af.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedCommission.distribution.af.percentage}%
                        </p>
                        <Badge
                          variant={selectedCommission.distribution.af.status === 'done' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {selectedCommission.distribution.af.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Recipient (Core Member/DCP) */}
                {selectedCommission.distribution.final.userId && (
                  <div className="border border-gray-200 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">
                          {selectedCommission.distribution.final.userType === 'core-member' ? 'Core Member' : 'DCP'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedCommission.distribution.final.userId.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(selectedCommission.distribution.final.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedCommission.distribution.final.percentage}%
                        </p>
                        <Badge
                          variant={selectedCommission.distribution.final.status === 'done' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {selectedCommission.distribution.final.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Payment Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="ml-2 font-mono text-xs">{selectedCommission.paymentId._id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2">{formatCurrency(selectedCommission.paymentId.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Transaction Type:</span>
                  <span className="ml-2 capitalize">{selectedCommission.transactionType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Calculated At:</span>
                  <span className="ml-2">{formatDate(selectedCommission.calculatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CommissionDashboard;
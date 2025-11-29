import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Badge, Card, Input, Select } from '../../components/shared';
import {
  getAllPayouts,
  createPayout,
  markPayoutAsProcessing,
  markPayoutAsDone,
  markPayoutAsFailed,
  cancelPayout,
  Payout,
  CreatePayoutData,
  PaymentDetailsData
} from '../../api/payoutApi';
import { toast } from 'react-toastify';
import {
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiFilter
} from 'react-icons/fi';

const PayoutManagement: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  // Modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'pending' | 'processing' | 'done' | 'failed' | 'cancelled' | ''>('');
  const [roleFilter, setRoleFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);

  // Create Payout Form
  const [createForm, setCreateForm] = useState<CreatePayoutData>({
    recipientId: '',
    startDate: '',
    endDate: '',
    scheduledDate: '',
    tdsPercentage: 10
  });

  // Payment Details Form
  const [paymentForm, setPaymentForm] = useState<PaymentDetailsData>({
    method: 'bank_transfer',
    transactionId: '',
    transactionDate: ''
  });

  // Failure/Cancel reason
  const [failureReason, setFailureReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter, roleFilter, overdueFilter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.recipientRole = roleFilter;
      if (overdueFilter) params.overdue = true;

      const response = await getAllPayouts(params);
      setPayouts(response.data?.payouts || response.data || []);
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayout = async () => {
    try {
      if (!createForm.recipientId || !createForm.startDate || !createForm.endDate || !createForm.scheduledDate) {
        toast.error('Please fill all required fields');
        return;
      }

      await createPayout(createForm);
      toast.success('Payout created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({
        recipientId: '',
        startDate: '',
        endDate: '',
        scheduledDate: '',
        tdsPercentage: 10
      });
      fetchPayouts();
    } catch (error: any) {
      console.error('Error creating payout:', error);
      toast.error(error.response?.data?.message || 'Failed to create payout');
    }
  };

  const handleMarkAsProcessing = async (id: string) => {
    try {
      await markPayoutAsProcessing(id);
      toast.success('Payout marked as processing');
      fetchPayouts();
      setIsDetailsModalOpen(false);
    } catch (error: any) {
      console.error('Error marking payout as processing:', error);
      toast.error(error.response?.data?.message || 'Failed to update payout');
    }
  };

  const handleMarkAsDone = async () => {
    if (!selectedPayout) return;

    try {
      if (!paymentForm.transactionId || !paymentForm.transactionDate) {
        toast.error('Please enter transaction ID and date');
        return;
      }

      await markPayoutAsDone(selectedPayout._id, paymentForm);
      toast.success('Payout marked as done');
      setIsPaymentModalOpen(false);
      setIsDetailsModalOpen(false);
      setPaymentForm({
        method: 'bank_transfer',
        transactionId: '',
        transactionDate: ''
      });
      fetchPayouts();
    } catch (error: any) {
      console.error('Error marking payout as done:', error);
      toast.error(error.response?.data?.message || 'Failed to complete payout');
    }
  };

  const handleMarkAsFailed = async () => {
    if (!selectedPayout) return;

    try {
      if (!failureReason) {
        toast.error('Please enter failure reason');
        return;
      }

      await markPayoutAsFailed(selectedPayout._id, failureReason);
      toast.success('Payout marked as failed');
      setIsFailModalOpen(false);
      setIsDetailsModalOpen(false);
      setFailureReason('');
      fetchPayouts();
    } catch (error: any) {
      console.error('Error marking payout as failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update payout');
    }
  };

  const handleCancelPayout = async () => {
    if (!selectedPayout) return;

    try {
      await cancelPayout(selectedPayout._id, cancelReason);
      toast.success('Payout cancelled successfully');
      setIsCancelModalOpen(false);
      setIsDetailsModalOpen(false);
      setCancelReason('');
      fetchPayouts();
    } catch (error: any) {
      console.error('Error cancelling payout:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel payout');
    }
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
      processing: 'info',
      done: 'success',
      failed: 'danger',
      cancelled: 'danger'
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <FiCheckCircle className="text-green-600" />;
      case 'failed':
        return <FiXCircle className="text-red-600" />;
      case 'cancelled':
        return <FiXCircle className="text-gray-600" />;
      case 'processing':
        return <FiAlertCircle className="text-blue-600" />;
      default:
        return <FiClock className="text-yellow-600" />;
    }
  };

  const isOverdue = (scheduledDate: string, status: string) => {
    if (status !== 'pending') return false;
    return new Date(scheduledDate) < new Date();
  };

  const columns = [
    {
      key: 'recipient',
      label: 'Recipient',
      render: (payout: Payout) => (
        <div>
          <div className="font-medium">{payout.recipient.name}</div>
          <div className="text-xs text-gray-500">{payout.recipient.email}</div>
          <Badge variant="info" size="sm">
            {payout.recipientRole.replace('-', ' ')}
          </Badge>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (payout: Payout) => (
        <div>
          <div className="font-semibold text-lg text-green-600">
            {formatCurrency(payout.amount)}
          </div>
          <div className="text-xs text-gray-500">
            Net: {formatCurrency(payout.taxDetails.netAmount)}
          </div>
          <div className="text-xs text-red-500">
            TDS: {formatCurrency(payout.taxDetails.tdsAmount)} ({payout.taxDetails.tdsPercentage}%)
          </div>
        </div>
      )
    },
    {
      key: 'breakdown',
      label: 'Breakdown',
      render: (payout: Payout) => (
        <div className="text-sm">
          <div className="text-purple-600">
            Flagship: {formatCurrency(payout.breakdown.flagship.amount)} ({payout.breakdown.flagship.count})
          </div>
          <div className="text-blue-600">
            Digital: {formatCurrency(payout.breakdown.digital.amount)} ({payout.breakdown.digital.count})
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {payout.commissionCount} total commissions
          </div>
        </div>
      )
    },
    {
      key: 'period',
      label: 'Period',
      render: (payout: Payout) => (
        <div className="text-sm">
          <div>{formatDate(payout.payoutPeriod.startDate)}</div>
          <div className="text-gray-500">to</div>
          <div>{formatDate(payout.payoutPeriod.endDate)}</div>
        </div>
      )
    },
    {
      key: 'scheduledDate',
      label: 'Scheduled',
      render: (payout: Payout) => (
        <div>
          <div>{formatDate(payout.scheduledDate)}</div>
          {isOverdue(payout.scheduledDate, payout.status) && (
            <Badge variant="danger" size="sm">OVERDUE</Badge>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (payout: Payout) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(payout.status)}
          {getStatusBadge(payout.status)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (payout: Payout) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPayout(payout);
            setIsDetailsModalOpen(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{payouts.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiDollarSign className="text-blue-600 text-2xl" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {payouts.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiClock className="text-yellow-600 text-2xl" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {payouts.filter(p => p.status === 'done').length}
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
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {payouts.filter(p => p.status === 'failed').length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FiXCircle className="text-red-600 text-2xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card
        title="Payout Management"
        subtitle="Manage and process all payouts"
        headerAction={
          <div className="flex gap-3">
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'done', label: 'Done' },
                { value: 'failed', label: 'Failed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              fullWidth={false}
              className="w-40"
            />
            <Select
              options={[
                { value: '', label: 'All Roles' },
                { value: 'master-franchise', label: 'Master Franchise' },
                { value: 'area-franchise', label: 'Area Franchise' },
                { value: 'core-member', label: 'Core Member' },
                { value: 'dcp', label: 'DCP' },
                { value: 'cgc', label: 'CGC' }
              ]}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              fullWidth={false}
              className="w-40"
            />
            <Button
              variant={overdueFilter ? 'primary' : 'outline'}
              size="md"
              onClick={() => setOverdueFilter(!overdueFilter)}
            >
              <FiFilter className="mr-2" />
              {overdueFilter ? 'Show All' : 'Overdue Only'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Payout
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          data={payouts}
          loading={loading}
          onRowClick={(payout) => {
            setSelectedPayout(payout);
            setIsDetailsModalOpen(true);
          }}
          emptyMessage="No payouts found"
        />
      </Card>

      {/* Create Payout Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Payout"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Recipient User ID"
            value={createForm.recipientId}
            onChange={(e) => setCreateForm({ ...createForm, recipientId: e.target.value })}
            placeholder="Enter user ID"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Period Start Date"
              type="date"
              value={createForm.startDate}
              onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
              required
            />
            <Input
              label="Period End Date"
              type="date"
              value={createForm.endDate}
              onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
              required
            />
          </div>
          <Input
            label="Scheduled Payment Date"
            type="date"
            value={createForm.scheduledDate}
            onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
            required
          />
          <Input
            label="TDS Percentage"
            type="number"
            value={createForm.tdsPercentage?.toString() || '10'}
            onChange={(e) => setCreateForm({ ...createForm, tdsPercentage: parseFloat(e.target.value) })}
            placeholder="10"
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePayout}>
              Create Payout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payout Details Modal */}
      {selectedPayout && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Payout Details"
          size="2xl"
        >
          <div className="space-y-6">
            {/* Recipient Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Recipient Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{selectedPayout.recipient.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{selectedPayout.recipient.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2">{selectedPayout.recipient.phoneNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Role:</span>
                  <span className="ml-2">
                    <Badge variant="info">{selectedPayout.recipientRole}</Badge>
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div>
              <h4 className="font-semibold mb-3">Amount Breakdown</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Gross Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedPayout.amount)}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-sm text-gray-600">TDS ({selectedPayout.taxDetails.tdsPercentage}%)</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedPayout.taxDetails.tdsAmount)}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Net Payable</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedPayout.taxDetails.netAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div>
              <h4 className="font-semibold mb-3">Commission Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-purple-200 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-purple-600">Flagship Membership</p>
                      <p className="text-xs text-gray-500">{selectedPayout.breakdown.flagship.count} commissions</p>
                    </div>
                    <p className="font-semibold text-purple-600">
                      {formatCurrency(selectedPayout.breakdown.flagship.amount)}
                    </p>
                  </div>
                </div>
                <div className="border border-blue-200 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-blue-600">Digital Membership</p>
                      <p className="text-xs text-gray-500">{selectedPayout.breakdown.digital.count} commissions</p>
                    </div>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(selectedPayout.breakdown.digital.amount)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total: {selectedPayout.commissionCount} commissions
              </p>
            </div>

            {/* Payment Period */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Payment Period</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedPayout.payoutPeriod.startDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">End Date:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedPayout.payoutPeriod.endDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedPayout.scheduledDate)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details (if exists) */}
            {selectedPayout.paymentDetails && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Payment Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Method:</span>
                    <span className="ml-2 font-medium capitalize">{selectedPayout.paymentDetails.method?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="ml-2 font-mono text-xs">{selectedPayout.paymentDetails.transactionId || 'N/A'}</span>
                  </div>
                  {selectedPayout.paymentDetails.transactionDate && (
                    <div>
                      <span className="text-gray-600">Transaction Date:</span>
                      <span className="ml-2">{formatDate(selectedPayout.paymentDetails.transactionDate)}</span>
                    </div>
                  )}
                  {selectedPayout.paymentDetails.upiId && (
                    <div>
                      <span className="text-gray-600">UPI ID:</span>
                      <span className="ml-2">{selectedPayout.paymentDetails.upiId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status and Notes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Status Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2">{getStatusBadge(selectedPayout.status)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Retry Count:</span>
                  <span className="ml-2 font-medium">{selectedPayout.retryCount}</span>
                </div>
                {selectedPayout.failureReason && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Failure Reason:</span>
                    <p className="text-red-600 mt-1">{selectedPayout.failureReason}</p>
                  </div>
                )}
                {selectedPayout.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notes:</span>
                    <p className="mt-1">{selectedPayout.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {selectedPayout.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => handleMarkAsProcessing(selectedPayout._id)}
                  >
                    Mark as Processing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    Cancel Payout
                  </Button>
                </>
              )}
              {selectedPayout.status === 'processing' && (
                <>
                  <Button
                    variant="success"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Mark as Done
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setIsFailModalOpen(true)}
                  >
                    Mark as Failed
                  </Button>
                </>
              )}
              {selectedPayout.status === 'failed' && (
                <Button
                  variant="primary"
                  onClick={() => handleMarkAsProcessing(selectedPayout._id)}
                >
                  Retry Processing
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Details Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Enter Payment Details"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Payment Method"
            options={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'upi', label: 'UPI' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'cash', label: 'Cash' },
              { value: 'wallet', label: 'Wallet' }
            ]}
            value={paymentForm.method || 'bank_transfer'}
            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
          />
          <Input
            label="Transaction ID"
            value={paymentForm.transactionId || ''}
            onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
            placeholder="Enter transaction ID"
            required
          />
          <Input
            label="Transaction Date"
            type="date"
            value={paymentForm.transactionDate || ''}
            onChange={(e) => setPaymentForm({ ...paymentForm, transactionDate: e.target.value })}
            required
          />
          {paymentForm.method === 'upi' && (
            <Input
              label="UPI ID"
              value={paymentForm.upiId || ''}
              onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
              placeholder="example@upi"
            />
          )}
          {paymentForm.method === 'cheque' && (
            <Input
              label="Cheque Number"
              value={paymentForm.chequeNumber || ''}
              onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })}
              placeholder="Enter cheque number"
            />
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleMarkAsDone}>
              Complete Payout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Failure Reason Modal */}
      <Modal
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        title="Mark as Failed"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Failure Reason
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="Enter reason for failure..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsFailModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleMarkAsFailed}>
              Mark as Failed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Reason Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Payout"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Go Back
            </Button>
            <Button variant="danger" onClick={handleCancelPayout}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayoutManagement;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCommissions, Commission, deleteCommission } from '../../api/commissionApi';
import { getUserFromLocalStorage } from '../../api/auth';
import { toast } from 'react-toastify';
import { FiDollarSign, FiUsers, FiClock, FiCheckCircle, FiFilter, FiDownload, FiEye, FiSettings, FiTrash2 } from 'react-icons/fi';
import { Card, Button } from '../../components/shared';

const CommissionTracking: React.FC = () => {
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCommissions: 0,
    totalAmount: 0,
    pending: 0,
    completed: 0
  });

  // Filters
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'flagship' | 'digital'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partially_paid' | 'completed'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Current user
  const currentUser = getUserFromLocalStorage();
  const userRole = currentUser?.role || 'member';

  useEffect(() => {
    fetchCommissions();
  }, [membershipFilter, statusFilter, dateRange]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (membershipFilter !== 'all') params.membershipType = membershipFilter;
      if (statusFilter !== 'all') params.overallStatus = statusFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await getAllCommissions(params);
      const data = response?.data?.data || response?.data || response;

      setCommissions(data.commissions || []);
      setSummary(data.summary || {
        totalCommissions: 0,
        totalAmount: 0,
        pending: 0,
        completed: 0
      });
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commissionId: string) => {
    if (!window.confirm('⚠️ Are you sure you want to DELETE this commission? This action cannot be undone!')) return;

    try {
      await deleteCommission(commissionId);
      toast.success('✅ Commission deleted successfully!');
      fetchCommissions(); // Refresh
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete commission');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-700 border-orange-200',
      partially_paid: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200'
    };

    const icons = {
      pending: <FiClock className="w-3 h-3" />,
      partially_paid: <FiDollarSign className="w-3 h-3" />,
      completed: <FiCheckCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Calculate user's earnings from a commission
  const getMyEarnings = (commission: Commission) => {
    const userId = currentUser?._id;

    if (userRole === 'admin') {
      return commission.distribution.sa;
    } else if (userRole === 'master-franchise') {
      if (commission.distribution.mf.userId?._id === userId) {
        return commission.distribution.mf;
      }
    } else if (userRole === 'area-franchise') {
      if (commission.distribution.af.userId?._id === userId) {
        return commission.distribution.af;
      }
    } else if (userRole === 'core-member' || userRole === 'dcp') {
      if (commission.distribution.final.userId?._id === userId) {
        return commission.distribution.final;
      }
    }

    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Tracking</h1>
        <p className="text-gray-600">
          {userRole === 'admin'
            ? 'View and manage all commission distributions'
            : 'Track your commission earnings'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Commissions</p>
              <p className="text-3xl font-bold mt-1">{summary.totalCommissions}</p>
            </div>
            <FiUsers className="w-10 h-10 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Amount</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <FiDollarSign className="w-10 h-10 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold mt-1">{summary.pending}</p>
            </div>
            <FiClock className="w-10 h-10 text-orange-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold mt-1">{summary.completed}</p>
            </div>
            <FiCheckCircle className="w-10 h-10 text-purple-200" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FiFilter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
            <select
              value={membershipFilter}
              onChange={(e) => setMembershipFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="flagship">Flagship</option>
              <option value="digital">Digital</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setMembershipFilter('all');
              setStatusFilter('all');
              setDateRange({ start: '', end: '' });
            }}
          >
            Clear Filters
          </Button>
          <Button variant="primary" className="flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Commission Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Source Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Base Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Commission Pool
                </th>
                {userRole === 'admin' ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      MF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      AF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Final
                    </th>
                  </>
                ) : (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    My Earnings
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                {(userRole === 'admin' || userRole === 'master-franchise') && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={userRole === 'admin' ? 10 : 7} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-gray-600">Loading commissions...</span>
                    </div>
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'admin' ? 10 : 7} className="px-4 py-8 text-center text-gray-500">
                    No commissions found
                  </td>
                </tr>
              ) : (
                commissions.map((commission) => {
                  const myEarnings = getMyEarnings(commission);

                  return (
                    <tr key={commission._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {commission.sourceMember.name}
                          </p>
                          <p className="text-xs text-gray-500">{commission.sourceMember.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          commission.membershipType === 'flagship'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {commission.originalMembershipType || commission.membershipType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(commission.baseAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        {formatCurrency(commission.totalCommissionPool)}
                      </td>

                      {userRole === 'admin' ? (
                        <>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(commission.distribution.mf.amount)}
                              </p>
                              <p className="text-gray-500">{commission.distribution.mf.percentage}%</p>
                              <p className="text-gray-600 truncate max-w-[100px]">
                                {commission.distribution.mf.userId?.name || 'Unassigned'}
                              </p>
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                commission.distribution.mf.status === 'done'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {commission.distribution.mf.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(commission.distribution.af.amount)}
                              </p>
                              <p className="text-gray-500">{commission.distribution.af.percentage}%</p>
                              <p className="text-gray-600 truncate max-w-[100px]">
                                {commission.distribution.af.userId?.name || 'Unassigned'}
                              </p>
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                commission.distribution.af.status === 'done'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {commission.distribution.af.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(commission.distribution.final.amount)}
                              </p>
                              <p className="text-gray-500">{commission.distribution.final.percentage}%</p>
                              <p className="text-gray-600 truncate max-w-[100px]">
                                {commission.distribution.final.userId?.name || 'Unassigned'}
                              </p>
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                commission.distribution.final.status === 'done'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {commission.distribution.final.status}
                              </span>
                            </div>
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3">
                          {myEarnings ? (
                            <div className="text-sm">
                              <p className="font-bold text-green-600">
                                {formatCurrency(myEarnings.amount)}
                              </p>
                              <p className="text-xs text-gray-500">{myEarnings.percentage}% of pool</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                                myEarnings.status === 'done'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {myEarnings.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                      )}

                      <td className="px-4 py-3">
                        {getStatusBadge(commission.overallStatus)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(commission.calculatedAt)}
                      </td>

                      {/* Actions Column */}
                      {(userRole === 'admin' || userRole === 'master-franchise') && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Admin Actions */}
                            {userRole === 'admin' && (
                              <>
                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDelete(commission._id)}
                                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  title="Delete Commission"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Zone Partner Actions */}
                            {userRole === 'master-franchise' && (
                              <button
                                onClick={() => navigate(`/finance/commission-allocation/${commission._id}`)}
                                className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                title="Allocate to Area"
                              >
                                <FiSettings className="w-4 h-4" />
                              </button>
                            )}

                            {/* View Details for All */}
                            <button
                              onClick={() => navigate(`/finance/commission-allocation/${commission._id}`)}
                              className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default CommissionTracking;

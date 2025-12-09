import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommissionById, Commission } from '../../api/commissionApi';
import { toast } from 'react-toastify';
import { Card, Button } from '../../components/shared';
import { FiArrowLeft, FiUser, FiDollarSign } from 'react-icons/fi';

const ZoneCommissionAllocation: React.FC = () => {
  const { commissionId } = useParams<{ commissionId: string }>();
  const navigate = useNavigate();

  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (commissionId) {
      fetchCommissionDetails();
    }
  }, [commissionId]);

  const fetchCommissionDetails = async () => {
    try {
      setLoading(true);
      const response = await getCommissionById(commissionId!);
      const data = response?.data?.data || response?.data || response;
      setCommission(data);
    } catch (error) {
      console.error('Failed to fetch commission details:', error);
      toast.error('Failed to load commission details');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Loading commission details...</span>
        </div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Commission not found</p>
          <Button variant="secondary" onClick={() => navigate('/finance/commission-tracking')}>
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Tracking
          </Button>
        </div>
      </div>
    );
  }

  const zoneEarnings = commission.distribution.mf.amount;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/finance/commission-tracking')}
          className="mb-4"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Commission Tracking
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Details</h1>
        <p className="text-gray-600">
          View detailed commission breakdown and earnings
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Source Member Details */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <FiUser className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Source Member Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Member Name</p>
                <p className="text-base font-semibold text-gray-900">
                  {commission.sourceMember?.name || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-base text-gray-900">{commission.sourceMember.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Membership Type</p>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    commission.membershipType === 'flagship'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  {commission.originalMembershipType || commission.membershipType.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Registration Date</p>
                <p className="text-base text-gray-900">{formatDate(commission.calculatedAt)}</p>
              </div>
            </div>
          </Card>

          {/* Payment Summary */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <FiDollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Commission Breakdown</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-700 mb-2 font-medium">Base Amount (Admin)</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(commission.baseAmount)}
                </p>
                <p className="text-xs text-blue-600 mt-2">Total payment received</p>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                <p className="text-sm text-purple-700 mb-2 font-medium">Zone Partner Earnings (MF)</p>
                <p className="text-3xl font-bold text-purple-900">
                  {formatCurrency(zoneEarnings)}
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  {commission.distribution.mf.percentage}% commission
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ZoneCommissionAllocation;

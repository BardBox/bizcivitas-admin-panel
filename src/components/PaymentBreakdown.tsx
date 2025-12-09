import React from 'react';

interface Payment {
  feeType: string;
  amount: number;
  status: 'completed' | 'pending';
  date?: string;
}

interface PaymentBreakdownProps {
  payments: Payment[];
  showPendingOnly?: boolean;
}

const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({ payments, showPendingOnly = false }) => {
  const filteredPayments = showPendingOnly
    ? payments.filter(p => p.status === 'pending')
    : payments.filter(p => p.status === 'completed');

  if (!filteredPayments || filteredPayments.length === 0) {
    return null;
  }

  const formatFeeType = (feeType: string): string => {
    return feeType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="col-span-2 pt-3 border-t border-gray-200">
      <p className="text-gray-500 font-medium mb-2">
        {showPendingOnly ? 'Pending Payments:' : 'Payment Breakdown:'}
      </p>
      <div className="space-y-1.5">
        {filteredPayments.map((payment, index) => (
          <div
            key={index}
            className={`flex justify-between items-center px-3 py-1.5 rounded border ${
              payment.status === 'completed'
                ? 'bg-green-50 border-green-100'
                : 'bg-orange-50 border-orange-100'
            }`}
          >
            <span className="text-xs font-medium text-gray-700 capitalize">
              {formatFeeType(payment.feeType)}
            </span>
            <span
              className={`text-xs font-bold ${
                payment.status === 'completed' ? 'text-green-700' : 'text-orange-700'
              }`}
            >
              ₹{payment.amount?.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center px-3 py-2 rounded bg-indigo-100 border border-indigo-200 mt-2">
          <span className="text-xs font-bold text-indigo-900">Total ({showPendingOnly ? 'Pending' : 'Completed'})</span>
          <span className="text-sm font-bold text-indigo-700">
            ₹{filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentBreakdown;

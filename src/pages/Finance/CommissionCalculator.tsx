import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Breadcrumb } from '../../components/shared';
import { getAllCommissionConfigs, CommissionConfig } from '../../api/commissionConfigApi';
import { toast } from 'react-toastify';
import { Calculator, DollarSign, Users, TrendingUp, Info } from 'lucide-react';

// Membership Plans with Zoho Links (from website)
interface PaymentComponent {
  title: string;
  price: number;
  priceNoGst: number;
  breakdown: string;
  url: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  totalValue: number;
  components: PaymentComponent[];
  color: string;
}

const membershipPlans: MembershipPlan[] = [
  {
    id: 'core',
    name: 'Core Membership',
    totalValue: 550000,
    color: '#3b82f6',
    components: [
      {
        title: 'One-Time Registration Fees',
        price: 29500,
        priceNoGst: 25000,
        breakdown: '₹25,000 + ₹4,500 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/OTR-01',
      },
      {
        title: 'Membership Fees',
        price: 354000,
        priceNoGst: 300000,
        breakdown: '₹300,000 + ₹54,000 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/MEM-01',
      },
      {
        title: 'Community Launch Fees',
        price: 265500,
        priceNoGst: 225000,
        breakdown: '₹225,000 + ₹40,500 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/F-01',
      },
    ],
  },
  {
    id: 'flagship',
    name: 'Flagship Membership',
    totalValue: 383500,
    color: '#7c3aed',
    components: [
      {
        title: 'One-Time Registration Fees',
        price: 29500,
        priceNoGst: 25000,
        breakdown: '₹25,000 + ₹4,500 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/FOTR-0',
      },
      {
        title: 'Membership Fees',
        price: 354000,
        priceNoGst: 300000,
        breakdown: '₹300,000 + ₹54,000 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/FMF-1',
      },
      {
        title: 'Meeting/Event Fees',
        price: 29500,
        priceNoGst: 25000,
        breakdown: '₹25,000 + ₹4,500 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/FAM-2',
      },
    ],
  },
  {
    id: 'industria',
    name: 'Industria Membership',
    totalValue: 383500,
    color: '#ea580c',
    components: [
      {
        title: 'One-Time Registration Fees',
        price: 29500,
        priceNoGst: 25000,
        breakdown: '₹25,000 + ₹4,500 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/IOTR-0',
      },
      {
        title: 'Membership Fees',
        price: 354000,
        priceNoGst: 300000,
        breakdown: '₹300,000 + ₹54,000 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/IMF-1',
      },
      {
        title: 'Meeting/Event Fees',
        price: 29500,
        priceNoGst: 25000,
        breakdown: '₹25,000 + ₹4,500 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/IAM-2',
      },
    ],
  },
  {
    id: 'digital',
    name: 'Digital Membership',
    totalValue: 8259,
    color: '#22c55e',
    components: [
      {
        title: 'Annual Subscription Fees',
        price: 8259,
        priceNoGst: 6999,
        breakdown: '₹6,999 + ₹1,260 (18% GST)',
        url: 'https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/DIGM-01',
      },
    ],
  },
];

const CommissionCalculator: React.FC = () => {
  const [commissionConfigs, setCommissionConfigs] = useState<CommissionConfig[]>([]);

  // Form state
  const [selectedMembership, setSelectedMembership] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  useEffect(() => {
    fetchCommissionConfigs();
  }, []);

  const fetchCommissionConfigs = async () => {
    try {
      const data = await getAllCommissionConfigs();
      setCommissionConfigs(data);
    } catch (error) {
      console.error('Error fetching commission configs:', error);
      toast.error('Failed to load commission configurations');
    }
  };

  const selectedPlan = membershipPlans.find(p => p.id === selectedMembership);
  const selectedPaymentComponent = selectedPlan?.components.find((_, index) => index.toString() === selectedComponent);

  const getCommissionConfig = (membershipName: string): CommissionConfig | undefined => {
    return commissionConfigs.find(c => c.membershipType === membershipName && c.isActive);
  };

  const config = selectedPlan ? getCommissionConfig(selectedPlan.name) : undefined;

  // Calculate base amount (without GST)
  const baseAmount = useCustomAmount ? customAmount : (selectedPaymentComponent?.priceNoGst || 0);

  // Calculate commissions
  const calculateCommissions = () => {
    if (!config || !baseAmount) return null;

    return {
      superAdmin: {
        percentage: config.distribution.superAdmin,
        amount: (baseAmount * config.distribution.superAdmin) / 100,
      },
      masterFranchise: {
        percentage: config.distribution.masterFranchise,
        amount: (baseAmount * config.distribution.masterFranchise) / 100,
      },
      areaFranchise: {
        percentage: config.distribution.areaFranchise,
        amount: (baseAmount * config.distribution.areaFranchise) / 100,
      },
      finalRecipient: {
        percentage: config.distribution.finalRecipient,
        amount: (baseAmount * config.distribution.finalRecipient) / 100,
        label: selectedPlan?.id === 'digital' ? 'DCP (Digital Chapter Partner)' : 'Core Member (Referrer)',
      },
      totalPool: {
        percentage: config.totalPoolPercentage,
        amount: (baseAmount * config.totalPoolPercentage) / 100,
      },
    };
  };

  const commissions = calculateCommissions();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isOfflineMembership = selectedPlan && ['core', 'flagship', 'industria'].includes(selectedPlan.id);

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/finance' },
          { label: 'Commission Calculator' },
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Calculator</h1>
          <p className="text-gray-600 mt-1">
            Calculate commission breakdown for membership payments
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/commission-settings'}
          variant="outline"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Commission Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <Card title="Select Membership & Payment">
            <div className="space-y-4">
              {/* Membership Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedMembership}
                  onChange={(e) => {
                    setSelectedMembership(e.target.value);
                    setSelectedComponent('');
                    setUseCustomAmount(false);
                  }}
                >
                  <option value="">-- Select Membership --</option>
                  {membershipPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Component */}
              {selectedPlan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Component
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedComponent}
                    onChange={(e) => {
                      setSelectedComponent(e.target.value);
                      setUseCustomAmount(false);
                    }}
                  >
                    <option value="">-- Select Component --</option>
                    {selectedPlan.components.map((component, index) => (
                      <option key={index} value={index.toString()}>
                        {component.title} - {formatCurrency(component.priceNoGst)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Component Details */}
              {selectedPaymentComponent && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedPaymentComponent.priceNoGst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">With GST:</span>
                    <span className="font-medium">{formatCurrency(selectedPaymentComponent.price)}</span>
                  </div>
                  <a
                    href={selectedPaymentComponent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open Zoho Payment Link
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Custom Amount Toggle */}
              {selectedPlan && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomAmount}
                      onChange={(e) => setUseCustomAmount(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Use custom amount</span>
                  </label>
                </div>
              )}

              {/* Custom Amount Input */}
              {useCustomAmount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Amount (without GST)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                  />
                </div>
              )}

              {/* Commission Config Status */}
              {selectedPlan && (
                <div className="pt-4 border-t">
                  {config ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="success">Commission Active</Badge>
                      <span className="text-gray-600">Pool: {config.totalPoolPercentage}%</span>
                    </div>
                  ) : (
                    <Badge variant="warning">No Commission Config Found</Badge>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Info Card */}
          <Card title="How It Works" className="mt-4">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <p>
                  <strong>SA (Super Admin)</strong>: Platform owner commission
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <p>
                  <strong>MF (Master Franchise)</strong>: Master zone partner commission
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <p>
                  <strong>AF (Area Franchise)</strong>: Zone partner commission
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <p>
                  <strong>Core Member / DCP</strong>: Referring member commission
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Commission Breakdown */}
        <div className="lg:col-span-2">
          <Card
            title="Commission Breakdown"
            subtitle={
              baseAmount
                ? `Based on ${formatCurrency(baseAmount)} base amount`
                : 'Select a membership and component to see breakdown'
            }
          >
            {commissions ? (
              <div className="space-y-6">
                {/* Visual Flow Diagram */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <DollarSign className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-xs text-gray-600">Base Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(baseAmount)}</p>
                    </div>

                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-xs text-gray-600">Total Commission</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(commissions.totalPool.amount)}</p>
                      <p className="text-xs text-gray-500">{commissions.totalPool.percentage}% of base</p>
                    </div>
                  </div>
                </div>

                {/* Commission Distribution Cards */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Distribution Hierarchy
                  </h3>

                  {/* Super Admin */}
                  <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">SA → Super Admin</p>
                        <p className="text-sm text-gray-600">Platform Owner</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(commissions.superAdmin.amount)}
                        </p>
                        <Badge>{commissions.superAdmin.percentage}%</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Master Franchise */}
                  <div className="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">MF → Master Franchise</p>
                        <p className="text-sm text-gray-600">Master Zone Partner</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">
                          {formatCurrency(commissions.masterFranchise.amount)}
                        </p>
                        <Badge variant="info">{commissions.masterFranchise.percentage}%</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Area Franchise */}
                  <div className="border-2 border-orange-200 rounded-lg p-4 hover:border-orange-400 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">AF → Area Franchise</p>
                        <p className="text-sm text-gray-600">Zone Partner</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(commissions.areaFranchise.amount)}
                        </p>
                        <Badge variant="warning">{commissions.areaFranchise.percentage}%</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Final Recipient (Core Member or DCP) */}
                  {isOfflineMembership && (
                    <div className="border-2 border-green-200 rounded-lg p-4 hover:border-green-400 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{commissions.finalRecipient.label}</p>
                          <p className="text-sm text-gray-600">
                            {selectedPlan?.id === 'digital' ? 'Digital Partner' : 'Referring Core Member'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(commissions.finalRecipient.amount)}
                          </p>
                          <Badge variant="success">{commissions.finalRecipient.percentage}%</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Digital Membership - DCP */}
                  {!isOfflineMembership && selectedPlan?.id === 'digital' && (
                    <div className="border-2 border-green-200 rounded-lg p-4 hover:border-green-400 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">DCP → Digital Chapter Partner</p>
                          <p className="text-sm text-gray-600">Digital Membership Partner</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(commissions.finalRecipient.amount)}
                          </p>
                          <Badge variant="success">{commissions.finalRecipient.percentage}%</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Total Distributed:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        commissions.superAdmin.amount +
                        commissions.masterFranchise.amount +
                        commissions.areaFranchise.amount +
                        commissions.finalRecipient.amount
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">To Platform:</span>
                    <span className="font-semibold">
                      {formatCurrency(baseAmount - commissions.totalPool.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
                    <span>Total Payment:</span>
                    <span className="text-blue-600">{formatCurrency(baseAmount)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a membership and payment component to calculate commissions</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommissionCalculator;

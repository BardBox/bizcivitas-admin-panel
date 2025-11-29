import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, Badge, Breadcrumb } from '../../components/shared';
import {
  getAllCommissionConfigs,
  createOrUpdateCommissionConfig,
  resetCommissionConfigToDefaults,
  MEMBERSHIP_TYPES,
  DEFAULT_CONFIGS,
  CommissionConfig
} from '../../api/commissionConfigApi';
import { toast } from 'react-toastify';

const CommissionSettings: React.FC = () => {
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<string>('Flagship Membership');
  const [formData, setFormData] = useState({
    totalPoolPercentage: 12,
    distribution: {
      superAdmin: 0,
      masterFranchise: 12,
      areaFranchise: 7,
      finalRecipient: 4
    },
    notes: ''
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    // Load config when membership type changes
    const existingConfig = configs.find(c => c.membershipType === selectedMembership);
    if (existingConfig) {
      setFormData({
        totalPoolPercentage: existingConfig.totalPoolPercentage,
        distribution: existingConfig.distribution,
        notes: existingConfig.notes || ''
      });
    } else {
      // Load default
      const defaultConfig = DEFAULT_CONFIGS[selectedMembership];
      if (defaultConfig) {
        setFormData({
          totalPoolPercentage: defaultConfig.totalPoolPercentage,
          distribution: defaultConfig.distribution,
          notes: defaultConfig.notes || ''
        });
      }
    }
  }, [selectedMembership, configs]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getAllCommissionConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching commission configs:', error);
      toast.error('Failed to load commission configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const totalDistribution =
      formData.distribution.superAdmin +
      formData.distribution.masterFranchise +
      formData.distribution.areaFranchise +
      formData.distribution.finalRecipient;

    if (totalDistribution > 100) {
      toast.error(`Total distribution (${totalDistribution}%) cannot exceed 100%`);
      return;
    }

    if (formData.totalPoolPercentage < 0 || formData.totalPoolPercentage > 100) {
      toast.error('Total pool percentage must be between 0 and 100');
      return;
    }

    try {
      setLoading(true);
      await createOrUpdateCommissionConfig({
        membershipType: selectedMembership,
        ...formData
      });

      toast.success('Commission configuration saved successfully');
      fetchConfigs();
    } catch (error: any) {
      console.error('Error saving commission config:', error);
      toast.error(error.response?.data?.message || 'Failed to save commission configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Reset ${selectedMembership} to default configuration?`)) {
      return;
    }

    try {
      setLoading(true);
      await resetCommissionConfigToDefaults(selectedMembership);
      toast.success('Configuration reset to defaults');
      fetchConfigs();
    } catch (error) {
      console.error('Error resetting config:', error);
      toast.error('Failed to reset configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributionChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      distribution: {
        ...prev.distribution,
        [field]: Math.max(0, Math.min(100, value))
      }
    }));
  };

  const totalDistribution =
    formData.distribution.superAdmin +
    formData.distribution.masterFranchise +
    formData.distribution.areaFranchise +
    formData.distribution.finalRecipient;

  const isOverLimit = totalDistribution > 100;

  const getFinalRecipientLabel = () => {
    if (selectedMembership === 'Digital Membership') {
      return 'Digital Chapter Partner (DCP)';
    }
    return 'Core Member';
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/finance' },
          { label: 'Commission Settings' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <Card
            title="Commission Configuration"
            subtitle="Configure commission percentages for each membership type"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Membership Type Selector */}
              <div>
                <Select
                  label="Select Membership Type"
                  value={selectedMembership}
                  onChange={(e) => setSelectedMembership(e.target.value)}
                  disabled={loading}
                  options={MEMBERSHIP_TYPES.map(type => ({
                    value: type,
                    label: type
                  }))}
                  placeholder="Choose a membership type"
                />
              </div>

              {/* Total Pool Percentage */}
              <div>
                <Input
                  label="Total Commission Pool (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.totalPoolPercentage}
                  onChange={(e) => setFormData({ ...formData, totalPoolPercentage: parseFloat(e.target.value) || 0 })}
                  required
                  helperText="Percentage of the total payment that goes into commission pool"
                />
              </div>

              {/* Distribution Percentages */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800">
                  Commission Distribution (% of total payment amount)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Admin (SA) %"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.distribution.superAdmin}
                    onChange={(e) => handleDistributionChange('superAdmin', parseFloat(e.target.value) || 0)}
                  />

                  <Input
                    label="Master Franchise (MF) %"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.distribution.masterFranchise}
                    onChange={(e) => handleDistributionChange('masterFranchise', parseFloat(e.target.value) || 0)}
                  />

                  <Input
                    label="Area Franchise (AF) %"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.distribution.areaFranchise}
                    onChange={(e) => handleDistributionChange('areaFranchise', parseFloat(e.target.value) || 0)}
                  />

                  <Input
                    label={`${getFinalRecipientLabel()} %`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.distribution.finalRecipient}
                    onChange={(e) => handleDistributionChange('finalRecipient', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Total Distribution Indicator */}
                <div className={`p-4 rounded-lg ${isOverLimit ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isOverLimit ? 'text-red-700' : 'text-blue-700'}`}>
                      Total Distribution:
                    </span>
                    <Badge variant={isOverLimit ? 'danger' : 'success'}>
                      {totalDistribution.toFixed(2)}%
                    </Badge>
                  </div>
                  {isOverLimit && (
                    <p className="text-xs text-red-600 mt-1">
                      Total distribution cannot exceed 100%
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  maxLength={500}
                  placeholder="Add any notes about this configuration..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset to Default
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isOverLimit}
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Preview/Info Panel */}
        <div className="space-y-6">
          {/* Example Calculation */}
          <Card title="Example Calculation" subtitle="Based on ₹1,00,000 payment">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Amount:</span>
                <span className="font-medium">₹1,00,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Commission Pool ({formData.totalPoolPercentage}%):</span>
                <span className="font-medium text-blue-600">
                  ₹{(100000 * formData.totalPoolPercentage / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Admin:</span>
                  <span className="font-medium">
                    ₹{(100000 * formData.distribution.superAdmin / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Master Franchise:</span>
                  <span className="font-medium">
                    ₹{(100000 * formData.distribution.masterFranchise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Area Franchise:</span>
                  <span className="font-medium">
                    ₹{(100000 * formData.distribution.areaFranchise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{getFinalRecipientLabel()}:</span>
                  <span className="font-medium">
                    ₹{(100000 * formData.distribution.finalRecipient / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Info Box */}
          <Card title="Important Notes">
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Commission Pool:</strong> The total percentage of the payment amount that will be distributed as commission.
              </p>
              <p>
                <strong>Distribution:</strong> Individual percentages show how much each role gets from the total payment amount (not from the pool).
              </p>
              <p>
                <strong>Members from Area:</strong> When a member joins through an area, the commission is distributed to the Admin, assigned Master Franchise of the Zone, assigned Area Franchise of the Area, and the referring Core Member/DCP.
              </p>
              <p className="text-yellow-700 bg-yellow-50 p-2 rounded">
                <strong>⚠️ Warning:</strong> Changes will affect all new commissions calculated for this membership type.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommissionSettings;

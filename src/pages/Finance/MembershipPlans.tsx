import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Breadcrumb } from '../../components/shared';
import { getAllCommissionConfigs, CommissionConfig } from '../../api/commissionConfigApi';
import { toast } from 'react-toastify';
import { ExternalLink, DollarSign, Users, Settings, TrendingUp } from 'lucide-react';

// Membership Plans Data (from BizCivitas website)
interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  plans?: {
    title: string;
    price: number;
    priceNoGst?: number;
    paragraph?: string;
    breakdown?: string;
    url: string;
  }[];
  features: string[];
  color: {
    primary: string;
    secondary: string;
  };
}

const membershipPlans: MembershipPlan[] = [
  {
    id: "core",
    name: "Core Membership",
    slug: "core-membership",
    tagline: "Connect. Collaborate. Transform.",
    description:
      "Build your local presence. The BizCivitas Core Membership includes in-person event access, chapter meetings, and lead generation opportunities to strengthen your community business connections.",
    price: {
      amount: 550000,
      currency: "₹",
    },
    features: [
      "Targeted Networking: Join a curated network of purpose-driven professionals",
      "Collaborative Learning: Engage in interactive, agenda-driven sessions designed to spark ideas and share strategies",
      "Domestic & International Trips: Blend business with leisure (Bleisure) through annual travel retreats—4 days/3 nights domestic and 6 days/5 nights international",
      "Personal Development: Access expert-led workshops, mastermind circles, and transformative events",
    ],
    color: {
      primary: "#3b82f6",
      secondary: "#dbeafe",
    },
    plans: [
      {
        title: "One-Time Registration Fees",
        price: 29500,
        priceNoGst: 25000,
        paragraph:
          "A non-refundable fee for onboarding and activating your Bizcivitas membership.",
        breakdown: "₹25,000 + ₹4,500 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/OTR-01",
      },
      {
        title: "Membership Fees",
        price: 354000,
        priceNoGst: 300000,
        paragraph:
          "An annual subscription fee granting access to exclusive Bizcivitas communities, events, and benefits.",
        breakdown: "₹300,000 + ₹54,000 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/MEM-01",
      },
      {
        title: "Community Launch Fees",
        price: 265500,
        priceNoGst: 225000,
        paragraph:
          "Core member frees for launching community (Valid for 2 years).",
        breakdown: "₹225,000 + ₹40,500 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/F-01",
      },
    ],
  },
  {
    id: "flagship",
    name: "Flagship Membership",
    slug: "flagship-membership",
    tagline: "Where Ventures and Voyages Intersect",
    description:
      "Our highest level of membership. Gain exclusive access to premium events, executive roundtables, top-tier referrals, and all Core, Digital & Industria benefits with BizCivitas Flagship.",
    price: {
      amount: 350000,
      currency: "₹",
    },
    features: [
      "20 strategic meetings per year",
      "1 domestic and 1 international networking trip",
      "Access to exclusive BizCivitas events and digital platform",
      "Informal yet focused networking in vibrant settings",
      "Learning and development through workshops and keynote sessions",
      "High-value referrals and collaboration opportunities",
    ],
    plans: [
      {
        title: "One-Time Registration Fees",
        price: 29500,
        priceNoGst: 25000,
        paragraph:
          "A non-refundable fee for onboarding and activating your Bizcivitas membership.",
        breakdown: "₹25,000 + ₹4,500 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/FOTR-0",
      },
      {
        title: "Membership Fees",
        price: 354000,
        priceNoGst: 300000,
        paragraph:
          "An annual subscription fee granting access to exclusive Bizcivitas communities, events, and benefits.",
        breakdown: "₹300,000 + ₹54,000 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/FMF-1",
      },
      {
        title: "Meeting/Event Fees",
        price: 29500,
        priceNoGst: 25000,
        paragraph:
          "A recurring charge for attending structured Bizcivitas networking meetings and events.",
        breakdown: "₹25,000 + ₹4,500 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/FAM-2",
      },
    ],
    color: {
      primary: "#7c3aed",
      secondary: "#ede9fe",
    },
  },
  {
    id: "industria",
    name: "Industria Membership",
    slug: "industria-membership",
    tagline: "Built for Industry Leaders.",
    description:
      "Connect with your industry peers. The BizCivitas Industria Membership provides specialized networking, sector-specific events, and forums tailored to professionals in your field.",
    price: {
      amount: 350000,
      currency: "₹",
    },
    features: [
      "Qualified Circle: Connect only with verified industrialists",
      "Referral-Driven Networking: 20+ business-first meetings annually",
      "Spotlight sessions, recognition, and thought leadership within the community",
      "Join domestic and global visits to expos, plants, and JV partners (India, UAE, U.S.)",
      "Stay ahead with insights on trends, tech, and industrial innovation",
      "Business education tailored for industrial entrepreneurs",
    ],
    color: {
      primary: "#ea580c",
      secondary: "#fed7aa",
    },
    plans: [
      {
        title: "One-Time Registration Fees",
        price: 29500,
        priceNoGst: 25000,
        paragraph:
          "A non-refundable fee for onboarding and activating your Bizcivitas membership.",
        breakdown: "₹25,000 + ₹4,500 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/IOTR-0",
      },
      {
        title: "Membership Fees",
        price: 354000,
        priceNoGst: 300000,
        paragraph:
          "An annual subscription fee granting access to exclusive Bizcivitas communities, events, and benefits.",
        breakdown: "₹300,000 + ₹54,000 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/IMF-1",
      },
      {
        title: "Meeting/Event Fees",
        price: 29500,
        priceNoGst: 25000,
        paragraph:
          "A recurring charge for attending structured Bizcivitas networking meetings and events.",
        breakdown: "₹25,000 + ₹4,500 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/IAM-2",
      },
    ],
  },
  {
    id: "digital",
    name: "Digital Membership",
    slug: "digital-membership",
    tagline:
      "Join our global digital community. The BizCivitas Digital Membership offers virtual networking, exclusive online resources, and a digital directory profile to connect and grow your business remotely.",
    description:
      "Join our global digital community. The BizCivitas Digital Membership offers virtual networking, exclusive online resources, and a digital directory profile to connect and grow your business remotely.",
    price: {
      amount: 6999,
      currency: "₹",
    },
    features: [
      "Access to exclusive online networking events",
      "Digital business directory and member connections",
      "Monthly virtual workshops and webinars",
      "Business growth resources and templates",
      "Community forum access for peer-to-peer learning",
      "Email newsletters with industry insights",
      "Basic business consultation support",
    ],
    color: {
      primary: "#22c55e",
      secondary: "#dcfce7",
    },
    plans: [
      {
        title: "Annual Subscription Fees",
        price: 8259,
        priceNoGst: 6999,
        paragraph:
          "A non-refundable fee for onboarding and activating your Bizcivitas online membership.",
        breakdown: "₹6,999 + ₹1,260 (18% GST)",
        url: "https://billing.zohosecure.in/subscribe/9b35478580668e290319efc8004bc55fc1bb269e0b7ab346dbde1ccf1c7a189d/DIGM-01",
      },
    ],
  },
];

const MembershipPlans: React.FC = () => {
  const [commissionConfigs, setCommissionConfigs] = useState<CommissionConfig[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

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

  const getCommissionConfig = (membershipType: string): CommissionConfig | undefined => {
    return commissionConfigs.find(c => c.membershipType === membershipType && c.isActive);
  };

  const calculateCommission = (amount: number, membershipType: string) => {
    const config = getCommissionConfig(membershipType);
    if (!config) return null;

    return {
      superAdmin: (amount * config.distribution.superAdmin) / 100,
      masterFranchise: (amount * config.distribution.masterFranchise) / 100,
      areaFranchise: (amount * config.distribution.areaFranchise) / 100,
      finalRecipient: (amount * config.distribution.finalRecipient) / 100,
      total: (amount * config.totalPoolPercentage) / 100,
    };
  };

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/finance' },
          { label: 'Membership Plans' }
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-600 mt-1">
            View all membership plans with pricing, Zoho payment links, and commission breakdown
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/commission-settings'}
          variant="outline"
        >
          <Settings className="w-4 h-4 mr-2" />
          Commission Settings
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">{membershipPlans.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Configs</p>
              <p className="text-2xl font-bold text-gray-900">{commissionConfigs.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payment Links</p>
              <p className="text-2xl font-bold text-gray-900">
                {membershipPlans.reduce((sum, plan) => sum + (plan.plans?.length || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ExternalLink className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(membershipPlans.reduce((sum, plan) => sum + plan.price.amount, 0) / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Membership Plans */}
      <div className="space-y-6">
        {membershipPlans.map((plan) => {
          const config = getCommissionConfig(plan.name);
          const isExpanded = expandedPlan === plan.id;

          return (
            <Card key={plan.id}>
              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: plan.color.secondary }}
                      >
                        <DollarSign
                          className="w-6 h-6"
                          style={{ color: plan.color.primary }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.tagline}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: plan.color.primary }}>
                      {plan.price.currency}{plan.price.amount.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Total Package Value</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-700">{plan.description}</p>

                {/* Commission Status */}
                {config ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="success">Commission Active</Badge>
                    <span className="text-gray-600">
                      Total Pool: {config.totalPoolPercentage}% | MF: {config.distribution.masterFranchise}% |
                      AF: {config.distribution.areaFranchise}% |
                      Recipient: {config.distribution.finalRecipient}%
                    </span>
                  </div>
                ) : (
                  <Badge variant="warning">No Commission Config</Badge>
                )}

                {/* Toggle Details Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlanExpansion(plan.id)}
                  className="w-full"
                >
                  {isExpanded ? 'Hide Details' : 'View Payment Links & Commission Breakdown'}
                </Button>

                {/* Expanded Details */}
                {isExpanded && plan.plans && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold text-gray-900">Payment Components & Zoho Links</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {plan.plans.map((component, index) => {
                        const commission = calculateCommission(component.priceNoGst || component.price, plan.name);

                        return (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">{component.title}</h5>
                                <p className="text-sm text-gray-600 mt-1">{component.paragraph}</p>
                              </div>
                              <Badge>{component.breakdown}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Base Amount:</span>
                                <span className="ml-2 font-medium">₹{(component.priceNoGst || component.price).toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">With GST:</span>
                                <span className="ml-2 font-medium">₹{component.price.toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            {/* Commission Breakdown */}
                            {commission && (
                              <div className="bg-gray-50 rounded p-3 space-y-2">
                                <h6 className="text-xs font-semibold text-gray-700 uppercase">Commission Breakdown</h6>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Admin:</span>
                                    <span className="font-medium">₹{commission.superAdmin.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Master Franchise:</span>
                                    <span className="font-medium">₹{commission.masterFranchise.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Area Franchise:</span>
                                    <span className="font-medium">₹{commission.areaFranchise.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Recipient:</span>
                                    <span className="font-medium">₹{commission.finalRecipient.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between col-span-2 pt-2 border-t">
                                    <span className="font-semibold text-gray-700">Total Commission:</span>
                                    <span className="font-bold" style={{ color: plan.color.primary }}>
                                      ₹{commission.total.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Zoho Payment Link */}
                            <a
                              href={component.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition"
                              style={{ backgroundColor: plan.color.primary }}
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Zoho Payment Link
                            </a>
                          </div>
                        );
                      })}
                    </div>

                    {/* Key Features */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <svg
                              className="w-5 h-5 flex-shrink-0 mt-0.5"
                              fill="none"
                              stroke={plan.color.primary}
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MembershipPlans;

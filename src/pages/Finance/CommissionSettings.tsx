import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, Breadcrumb } from '../../components/shared';
import {
  getAllCommissionConfigs,
  createOrUpdateCommissionConfig,
  MEMBERSHIP_TYPES,
  DEFAULT_CONFIGS,
  CommissionConfig
} from '../../api/commissionConfigApi';
import { getAllZones, Zone } from '../../api/zoneApi';
import { getAllAreas, Area, getAreasByZone } from '../../api/areaApi';
import {
  createCommissionOverride,
  getCommissionOverrides,
  getRecentCommissions,
  CommissionOverrideData
} from '../../api/commissionApi';
import { getUserFromLocalStorage } from '../../api/auth';
import { getUsersByArea } from '../../api/rbacApi';
import { toast } from 'react-toastify';
import { FiAlertCircle, FiUser, FiPieChart, FiLock, FiClock, FiCheckCircle } from 'react-icons/fi';

// Define pricing constants explicitly to match CommissionCalculator
const MEMBERSHIP_PRICING: Record<string, number> = {
  'Core Membership': 354000,
  'Flagship Membership': 354000,
  'Industria Membership': 354000,
  'Digital Membership': 8259
};

const CommissionSettings: React.FC = () => {
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]); // Areas for MF or current Area for AF
  const [coreMembers, setCoreMembers] = useState<any[]>([]); // Core Members for AF
  const [dgcMembers, setDgcMembers] = useState<any[]>([]); // DGCs for AF
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]); // Store recent manual payments
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Selection State
  const [selectedMembership, setSelectedMembership] = useState<string>('Flagship Membership');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(''); // For Admin
  const [selectedAreaId, setSelectedAreaId] = useState<string>(''); // For MF (Area ID) OR AF (Member ID context)
  const [selectedMemberType, setSelectedMemberType] = useState<'core-member' | 'dgc'>('core-member'); // For AF: which type of member

  // User Context
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Configuration State
  const [networkShare, setNetworkShare] = useState<number>(12); // Admin sets this (Global)
  // MF/AF sets this (Relative Share of THEIR pool)
  const [areaShare, setAreaShare] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const currentUser = getUserFromLocalStorage();
    if (currentUser) {
      setUser(currentUser);
      setUserRole(currentUser.role);
    }

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

    const fetchZones = async () => {
      try {
        const data = await getAllZones();
        if (Array.isArray(data)) {
          setZones(data);
        }
      } catch (error) {
        console.error('Error fetching zones:', error);
      }
    };

    const fetchRecent = async () => {
      try {
        console.log("Fetching recent manual payments...");
        const response = await getRecentCommissions(20); // Get last 20
        console.log("Recent payments response:", response);

        // Handle different response structures
        const data = response?.data?.data || response?.data || response;

        if (Array.isArray(data) && data.length > 0) {
          console.log("Setting recent transactions:", data.length, "items");
          console.log("First item:", data[0]);
          console.log("First item userId:", data[0].userId);
          console.log("First item user:", data[0].user);
          setRecentTransactions(data);
        } else {
          console.warn("No data found in response. Full response:", response);
          setRecentTransactions([]);
        }
      } catch (error) {
        console.error("Failed to fetch recent transactions:", error);
        toast.error("Failed to load recent payments");
        setRecentTransactions([]);
      }
    };

    fetchConfigs();
    fetchZones();
    fetchRecent();
  }, []);

  const fetchLocalCoreMembers = async (area: Area) => {
    try {
      // Extract clean area name (remove city suffix if present)
      // e.g., "Jawahar Nagar (Vadodara)" -> "Jawahar Nagar"
      const cleanAreaName = area.areaName.split(' (')[0].trim();

      // Fetch all users in this business area
      const response = await getUsersByArea(cleanAreaName);
      const allUsers = response?.data?.users || [];

      // Filter for Core Members (Core Membership, Flagship Membership, Industria Membership)
      const validMembers = allUsers.filter((userData: any) => {
        const membershipType = userData.membershipType;
        return membershipType === 'Core Membership' ||
          membershipType === 'Flagship Membership' ||
          membershipType === 'Industria Membership';
      });

      setCoreMembers(validMembers);
      console.log(`✅ Found ${validMembers.length} core members in ${cleanAreaName}`);
    } catch (err) {
      console.error("Failed to fetch core members", err);
    }
  };

  const fetchLocalDGCs = async (area: Area) => {
    try {
      // Extract clean area name
      const cleanAreaName = area.areaName.split(' (')[0].trim();

      // Fetch all users in this business area
      const response = await getUsersByArea(cleanAreaName);
      const allUsers = response?.data?.users || [];

      // Filter for Digital Members
      const validDGCs = allUsers.filter((userData: any) => {
        return userData.membershipType === 'Digital Membership';
      });

      setDgcMembers(validDGCs);
      console.log(`✅ Found ${validDGCs.length} digital members in ${cleanAreaName}`);
    } catch (err) {
      console.error("Failed to fetch DGCs", err);
    }
  };

  const loadAreasForZone = async (zoneId: string) => {
    try {
      const areaList = await getAreasByZone(zoneId);
      setAreas(areaList || []);
    } catch (err) {
      console.error("Failed to load areas", err);
    }
  };

  // Identify Context for MF and AF
  useEffect(() => {
    if (userRole === 'master-franchise' && zones.length > 0 && user) {
      // Find the zone assigned to this MF
      const myZone = zones.find(z =>
        (typeof z.assignedMFId === 'object' && z.assignedMFId?._id === user._id) ||
        z.assignedMFId === user._id
      );

      if (myZone) {
        setSelectedZoneId(myZone._id);
        loadAreasForZone(myZone._id);
      }
    } else if (userRole === 'area-franchise' && user) {
      // Find Area for AF
      const identifyArea = async () => {
        try {
          const allAreas = await getAllAreas();
          const myArea = allAreas.find((a: any) =>
            (typeof a.areaFranchise === 'object' && a.areaFranchise?._id === user._id) ||
            a.areaFranchise === user._id
          );
          if (myArea) {
            setAreas([myArea]); // Set context

            // Fetch both Core Members and DGCs for the area
            fetchLocalCoreMembers(myArea);
            fetchLocalDGCs(myArea);

            // If needed later, set Zone ID too
            if (myArea.zoneId) {
              setSelectedZoneId(typeof myArea.zoneId === 'object' ? myArea.zoneId._id : myArea.zoneId);
            }
          }
        } catch (e) {
          console.error("Failed to identify area", e);
        }
      };
      identifyArea();
    }
  }, [userRole, zones, user]);

  // Auto-set member type based on membership selection (for AF)
  useEffect(() => {
    if (userRole === 'area-franchise') {
      if (selectedMembership === 'Digital Membership') {
        setSelectedMemberType('dgc');
      } else {
        setSelectedMemberType('core-member');
      }
      // Reset selected member when membership type changes
      setSelectedAreaId('');
    }
  }, [selectedMembership, userRole]);

  // Refined Config Loading Effect
  useEffect(() => {
    const existingConfig = configs.find(c => c.membershipType === selectedMembership);

    if (existingConfig) {
      setNotes(existingConfig.notes || '');

      if (userRole === 'area-franchise') {
        // For AF, the "Root" is what they hold: areaFranchise + FinalRecipient
        const currentNetAreaShare = existingConfig.distribution?.areaFranchise || 0;
        const currentFinalShare = existingConfig.distribution?.finalRecipient || 0;
        const grossAvailableToArea = currentNetAreaShare + currentFinalShare;

        setNetworkShare(Number(grossAvailableToArea.toFixed(2))); // "Received"

        if (grossAvailableToArea > 0) {
          const relative = (currentFinalShare / grossAvailableToArea) * 100;
          setAreaShare(Math.round(relative * 100) / 100); // "Core Share"
        } else {
          setAreaShare(0);
        }
      } else {
        // Admin & MF
        setNetworkShare(existingConfig.totalPoolPercentage);

        if (userRole === 'master-franchise') {
          // MF sees Area Share relative to Total Pool (which is what MF receives basically)
          // Logic: masterFranchise + areaFranchise = Total Pool (roughly, if no super admin/others)
          // Actually, MF receives `totalPoolPercentage`.
          // MF gives `areaFranchise`.
          // Relative % = (areaFranchise / totalPoolPercentage) * 100

          if (existingConfig.distribution?.areaFranchise && existingConfig.totalPoolPercentage > 0) {
            // We must consider that areaFranchise might now be split into (Net Area + Final).
            // The MF GAVE the "gross area share".
            // So MF's view of "Area Share" should be (NetArea + Final).
            const totalAreaTree = (existingConfig.distribution.areaFranchise || 0) + (existingConfig.distribution.finalRecipient || 0);

            const relative = (totalAreaTree / existingConfig.totalPoolPercentage) * 100;
            setAreaShare(Math.round(relative * 100) / 100);
          } else {
            setAreaShare(0);
          }
        } else {
          // Admin logic default (rarely used for relative, usually absolute)
          setAreaShare(0);
        }
      }
    } else {
      const defaultConfig = DEFAULT_CONFIGS[selectedMembership] || DEFAULT_CONFIGS['Flagship Membership'];
      if (defaultConfig) {
        setNetworkShare(defaultConfig.totalPoolPercentage);
        setAreaShare(0);
      }
    }
  }, [selectedMembership, configs, userRole]);

  // Fetch Member Specific Override when a member is selected (AF Only)
  useEffect(() => {
    if (userRole === 'area-franchise' && selectedAreaId) {
      const fetchOverride = async () => {
        try {
          // selectedAreaId holds the Member ID in AF context
          const response = await getCommissionOverrides({
            memberId: selectedAreaId,
            membershipType: selectedMembership
          });

          if (response && response.data && response.data.length > 0) {
            const override = response.data[0];
            setAreaShare(override.commissionPercentage);
            setNotes(override.notes || '');
            // We don't change networkShare (gross received), that remains constant from config
            toast.info(`Loaded specific override for this member: ${override.commissionPercentage}%`);
          } else {
            // Revert to global config default if no override exists
            const existingConfig = configs.find(c => c.membershipType === selectedMembership);
            if (existingConfig) {
              const currentNetAreaShare = existingConfig.distribution?.areaFranchise || 0;
              const currentFinalShare = existingConfig.distribution?.finalRecipient || 0;
              const grossAvailable = currentNetAreaShare + currentFinalShare;
              if (grossAvailable > 0) {
                const relative = (currentFinalShare / grossAvailable) * 100;
                setAreaShare(Math.round(relative * 100) / 100);
              } else {
                setAreaShare(0);
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch overrides", error);
        }
      };
      fetchOverride();
    }
  }, [selectedAreaId, userRole, selectedMembership, configs]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getAllCommissionConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching commission configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole === 'master-franchise') {
      // MF Logic: Saving Area Share (Relative to Total Pool)
      const absoluteAreaShare = (networkShare * areaShare) / 100;
      const absoluteMasterShare = networkShare - absoluteAreaShare;

      const newDistribution = {
        superAdmin: 0,
        masterFranchise: Number(absoluteMasterShare.toFixed(2)),
        areaFranchise: Number(absoluteAreaShare.toFixed(2)),
        finalRecipient: 0 // Resetting final recipient as MF defines the Gross Area Bucket
      };

      try {
        setLoading(true);
        await createOrUpdateCommissionConfig({
          membershipType: selectedMembership,
          totalPoolPercentage: networkShare,
          distribution: newDistribution,
          notes
        });
        toast.success(`Distribution Saved! Area Partners will receive ${areaShare}% of your pool.`);
        fetchConfigs();
      } catch (error) {
        toast.error('Failed to save area distribution');
      } finally {
        setLoading(false);
      }

    } else if (userRole === 'area-franchise') {
      // AF Logic

      // CHECK IF THIS IS A SPECIFIC OVERRIDE
      if (selectedAreaId) {
        // Specific Member Override
        try {
          setLoading(true);
          const overrideData: CommissionOverrideData = {
            memberId: selectedAreaId,
            areaId: areas[0]?._id, // Context area
            membershipType: selectedMembership,
            memberType: selectedMemberType,
            commissionPercentage: areaShare,
            notes
          };

          await createCommissionOverride(overrideData);
          toast.success(`Override Saved! ${getSelectedMemberForAF()} will receive ${areaShare}% of your pool.`);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to save override');
        } finally {
          setLoading(false);
        }
        return; // EXIT HERE, DO NOT UPDATE GLOBAL CONFIG
      }

      // GLOBAL UPDATE (Existing Logic)
      // networkShare = Gross Available to AF (Area + Final)
      // areaShare = % to distribute to Final (Core)

      const absoluteFinalShare = (networkShare * areaShare) / 100;
      const absoluteNetAreaShare = networkShare - absoluteFinalShare;

      // We need to preserve Master Franchise share
      const existingConfig = configs.find(c => c.membershipType === selectedMembership);
      const currentMasterShare = existingConfig?.distribution?.masterFranchise || 0;
      // Ensure total pool logic is sound
      const currentTotalPool = existingConfig?.totalPoolPercentage || (currentMasterShare + networkShare);

      const newDistribution = {
        superAdmin: 0,
        masterFranchise: currentMasterShare,
        areaFranchise: Number(absoluteNetAreaShare.toFixed(2)),
        finalRecipient: Number(absoluteFinalShare.toFixed(2))
      };

      try {
        setLoading(true);
        await createOrUpdateCommissionConfig({
          membershipType: selectedMembership,
          totalPoolPercentage: currentTotalPool,
          distribution: newDistribution,
          notes
        });
        const memberTypeLabel = selectedMemberType === 'dgc' ? 'DGCs' : 'Core Members';
        toast.success(`Global Rule Saved! All ${memberTypeLabel} will receive ${areaShare}% of your pool (unless overridden).`);
        fetchConfigs();
      } catch (error) {
        toast.error('Failed to save core distribution');
      } finally {
        setLoading(false);
      }

    } else {
      // Admin Logic
      if (networkShare > 100) {
        toast.error(`Commission Share (${networkShare}%) cannot exceed 100%`);
        return;
      }
      const newDistribution = {
        superAdmin: 0,
        masterFranchise: networkShare,
        areaFranchise: 0,
        finalRecipient: 0
      };

      try {
        setLoading(true);
        await createOrUpdateCommissionConfig({
          membershipType: selectedMembership,
          totalPoolPercentage: networkShare,
          distribution: newDistribution,
          notes
        });
        toast.success(`Commission Saved! Zone Partner receives ${networkShare}% to distribute.`);
        fetchConfigs();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to save commission configuration');
      } finally {
        setLoading(false);
      }
    }
  };

  const exampleAmount = MEMBERSHIP_PRICING[selectedMembership] || 100000;

  // Helpers to get selected zone/area details
  const selectedZone = zones.find(z => z._id === selectedZoneId);
  const selectedArea = areas.find(a => a._id === (userRole === 'master-franchise' ? selectedAreaId : '')); // Only find actual Area object if MF selecting


  const getPartnerName = (entity: any) => {
    if (!entity) return 'Unassigned';
    const partner = entity.assignedMFId || entity.areaFranchise;
    if (partner && typeof partner === 'object') {
      return `${partner.fname} ${partner.lname || ''}`.trim();
    }
    return 'Assigned (Details Unavailable)';
  };

  // Get the selected member (DGC or Core Member) for AF
  const getSelectedMemberForAF = () => {
    if (!selectedAreaId) {
      return `All ${selectedMemberType === 'dgc' ? 'DGCs' : 'Core Members'}`;
    }
    const memberList = selectedMemberType === 'dgc' ? dgcMembers : coreMembers;
    const member = memberList.find(m => m.userId === selectedAreaId);
    return member ? member.name || 'Selected Member' : 'Selected Member';
  };

  const activePartnerName =
    userRole === 'master-franchise' ? getPartnerName(selectedArea) :
      userRole === 'area-franchise' ? getSelectedMemberForAF() :
        getPartnerName(selectedZone);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Finance', href: '/finance' },
          { label: 'Commission Settings' }
        ]}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Form Area */}
        <div className="flex-1 space-y-6">
          <Card
            title={userRole === 'master-franchise' ? "Zone Distribution Settings" : userRole === 'area-franchise' ? "Area Distribution Settings" : "Global Commission Settings"}
            subtitle={
              userRole === 'master-franchise' ? "Manage commission splits for your Area Partners" :
                userRole === 'area-franchise' ? "Manage commission splits for Core Members" :
                  "Define the master commission structure for the network"
            }
          >

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* 1. Membership Selection (Common) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {(userRole === 'master-franchise' || userRole === 'area-franchise') ? '1. Select Membership to Distribute' : '1. Select Membership Type'}
                  </label>
                  {(userRole === 'master-franchise' || userRole === 'area-franchise') && (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                      <FiLock className="w-3 h-3" />
                      <span>Received: {networkShare}%</span>
                    </div>
                  )}
                </div>
                {(userRole === 'master-franchise' || userRole === 'area-franchise') ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Membership Type</p>
                        <p className="font-bold text-gray-800 text-lg">{selectedMembership}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">Base Fee (Ref)</p>
                        <p className="font-mono font-medium text-gray-600">₹{exampleAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>


                    {/* Transaction Context - Interactive List */}
                    {recentTransactions.length > 0 && (
                      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <FiClock className="text-indigo-500" /> Recent Real Transactions
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                          {recentTransactions.map((tx: any) => (
                            <div
                              key={tx._id}
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setSelectedMembership(tx.membershipType);
                                if (tx.zoneId?._id) setSelectedZoneId(tx.zoneId._id);

                                // Logic for AF context
                                if (userRole === 'area-franchise') {
                                  if (tx.membershipType === 'Digital Membership') setSelectedMemberType('dgc');
                                  else setSelectedMemberType('core-member');
                                }
                                toast.info(`Loaded context: ${tx.paidBy?.fname} from ${tx.zoneId?.zoneName || 'Unknown Zone'}`);
                              }}
                              className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between group ${selectedTransaction?._id === tx._id
                                ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-200'
                                : 'bg-gray-50 border-gray-100 hover:border-indigo-300 hover:bg-white'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${tx.status === 'distributed' ? 'bg-green-500' : 'bg-yellow-500'}`} title={tx.status}></div>
                                <div>
                                  <p className="text-xs font-bold text-gray-800">{tx.paidBy?.fname} {tx.paidBy?.lname}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <span>{tx.membershipType}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-medium text-gray-700">₹{tx.amount?.toLocaleString()}</span>
                                    {tx.zoneId && (
                                      <>
                                        <span className="text-gray-300">|</span>
                                        <span>{tx.zoneId.zoneName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${selectedTransaction?._id === tx._id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                  {selectedTransaction?._id === tx._id ? 'Active' : 'Select'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transaction Context - Single Example Visualization */}
                    <div className={`rounded-xl border p-5 transition-colors ${selectedTransaction ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {selectedTransaction ? (
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                              <FiCheckCircle /> Real Data
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                              Simulation
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {selectedTransaction ? 'Calculating impact on selected transaction' : 'Showing commission flow for a typical sale'}
                          </span>
                        </div>
                        {selectedTransaction && (
                          <button
                            onClick={() => setSelectedTransaction(null)}
                            className="text-[10px] text-red-500 hover:text-red-700 font-medium underline"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Purchased By</p>
                          <p className="text-sm font-bold text-gray-800">
                            {selectedTransaction ? `${selectedTransaction.paidBy?.fname} ${selectedTransaction.paidBy?.lname || ''}` : 'Rahul Varma'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                            Location
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {selectedTransaction
                              ? `${selectedTransaction.areaId?.areaName || 'N/A'}, ${selectedTransaction.zoneId?.zoneName || 'N/A'}`
                              : (userRole === 'area-franchise' ? 'Direct Referral' : 'Alkapuri, Vadodara')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Plan Amount</p>
                          <p className="text-sm font-bold text-gray-800">
                            ₹{selectedTransaction ? selectedTransaction.amount?.toLocaleString('en-IN') : exampleAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                            {userRole === 'area-franchise' ? 'Zone Allocation' : 'Master Franchise Allocation'}
                          </p>
                          <p className="text-lg font-bold text-emerald-600">
                            ₹{Math.round(((selectedTransaction ? selectedTransaction.amount : exampleAmount) * (userRole === 'area-franchise' ? areaShare : networkShare)) / 100).toLocaleString('en-IN')}
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              ({userRole === 'area-franchise' ? areaShare : networkShare}%)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs text-gray-500 italic flex items-center gap-2">
                        <FiAlertCircle className="w-3 h-3" />
                        {selectedTransaction
                          ? `Setting this rule will apply to ${selectedTransaction.membershipType} sales in ${selectedTransaction.zoneId?.zoneName || 'this zone'}.`
                          : `You are configuring the global rule for ${selectedMembership}.`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedMembership}
                      onChange={(e) => setSelectedMembership(e.target.value)}
                      disabled={loading}
                      options={MEMBERSHIP_TYPES.map(type => ({ value: type, label: type }))}
                    />
                    <p className="text-xs text-gray-500 mt-2 ml-1">
                      Base Amount Reference: <span className="font-medium text-gray-900">₹{exampleAmount.toLocaleString('en-IN')}</span>
                    </p>

                    {/* Recent Manual Payments Dropdown for Admin */}
                    {recentTransactions.length > 0 && (
                      <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">
                          📋 Select Recent Manual Payment (Optional)
                        </label>
                        <Select
                          value={selectedTransaction?.userId || ''}
                          onChange={async (e) => {
                            const userId = e.target.value;
                            if (userId) {
                              try {
                                // Fetch full user details with payment summary
                                const response = await fetch(`http://localhost:8080/api/v1/users/user/${userId}`, {
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                  }
                                });
                                const data = await response.json();

                                if (data.success && data.data.user) {
                                  const userData = data.data.user;
                                  setSelectedTransaction({
                                    userId: userData._id,
                                    user: {
                                      fname: userData.fname,
                                      lname: userData.lname,
                                      email: userData.email,
                                      membershipType: userData.membershipType
                                    },
                                    zone: userData.zoneId ? { _id: userData.zoneId, zoneName: userData.zoneId } : null,
                                    area: userData.areaId ? { _id: userData.areaId, areaName: userData.areaId } : null,
                                    summary: userData.paymentSummary || {
                                      totalAmount: 0,
                                      completedAmount: 0,
                                      pendingAmount: 0,
                                      completedPayments: 0,
                                      pendingPayments: 0
                                    },
                                    payments: userData.paymentVerification || []
                                  });
                                  setSelectedMembership(userData.membershipType);
                                  toast.info(`Loaded: ${userData.fname} ${userData.lname} - ₹${userData.paymentSummary?.totalAmount?.toLocaleString()}`);
                                }
                              } catch (error) {
                                console.error('Failed to fetch user details:', error);
                                toast.error('Failed to load user details');
                              }
                            } else {
                              setSelectedTransaction(null);
                            }
                          }}
                          options={[
                            { value: '', label: '-- Select a user to auto-fill details --' },
                            ...recentTransactions
                              .filter((tx: any) => tx.user.membershipType === selectedMembership)
                              .map((tx: any) => ({
                                value: tx.userId,
                                label: `${tx.user.fname} ${tx.user.lname || ''}`
                              }))
                          ]}
                        />
                        {selectedTransaction && (
                          <div className="mt-3 p-3 bg-white rounded border border-indigo-200">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500 font-medium">User:</p>
                                <p className="text-gray-900 font-bold">{selectedTransaction.user.fname} {selectedTransaction.user.lname}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Total Paid:</p>
                                <p className="text-gray-900 font-bold">₹{selectedTransaction.summary.completedAmount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Zone:</p>
                                <p className="text-gray-900 font-bold">{selectedTransaction.zone?.zoneName || 'Not Assigned'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">Area:</p>
                                <p className="text-gray-900 font-bold">{selectedTransaction.area?.areaName || 'Not Assigned'}</p>
                              </div>
                              <div className="col-span-2 pt-2 border-t border-gray-200">
                                <p className="text-gray-500 font-medium mb-1">Payment Summary:</p>
                                <div className="flex gap-4 text-xs">
                                  <span className="text-green-600 font-semibold">✓ Completed: {selectedTransaction.summary.completedPayments} (₹{selectedTransaction.summary.completedAmount?.toLocaleString()})</span>
                                  {selectedTransaction.summary.pendingPayments > 0 && (
                                    <span className="text-orange-600 font-semibold">⏳ Pending: {selectedTransaction.summary.pendingPayments} (₹{selectedTransaction.summary.pendingAmount?.toLocaleString()})</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTransaction(null);
                                toast.info('Transaction cleared');
                              }}
                              className="mt-3 text-xs text-red-600 hover:text-red-800 font-medium underline"
                            >
                              Clear Selection
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 2. Context Selection (Role Dependent) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {userRole === 'master-franchise' ? '2. Select Area Partner (Context)' :
                      userRole === 'area-franchise' ? '2. Select Member Type (Context)' :
                        '2. Select Zone Partner (Context)'}
                  </label>
                </div>

                {userRole === 'master-franchise' ? (
                  // MF View: Select Area
                  <>
                    <div className="bg-indigo-50 p-3 rounded-lg mb-4 border border-indigo-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-indigo-500 uppercase font-bold">Your Global Allocation</p>
                        <p className="text-sm text-indigo-800">Received from Admin</p>
                      </div>
                      <span className="text-xl font-bold text-indigo-700">{networkShare}%</span>
                    </div>

                    <Select
                      value={selectedAreaId}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      options={[
                        { value: '', label: 'Select Area Partner...' },
                        ...areas.map(area => ({
                          value: area._id,
                          label: `${area.areaName} (${getPartnerName(area)})`
                        }))
                      ]}
                    />
                  </>
                ) : userRole === 'area-franchise' ? (
                  // AF View: Show Member Type based on Membership
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <FiUser className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-500 uppercase font-bold">Member Type</p>
                        <p className="text-blue-900 font-semibold text-lg">
                          {selectedMemberType === 'dgc' ? 'DGC (Digital Chapter Partner)' : 'Core Member'}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedMemberType === 'dgc'
                            ? 'For Digital Membership referrals'
                            : 'For Flagship/Industria/Premium Membership referrals'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Admin View: Select Zone
                  <Select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    options={[
                      { value: '', label: '-- Select a Zone to Preview Partner --' },
                      ...zones.map(z => ({ value: z._id, label: z.zoneName }))
                    ]}
                  />
                )}

                {(selectedZoneId || (selectedAreaId && userRole === 'master-franchise')) && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                        <FiUser className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-indigo-500 font-bold uppercase">Assigned Partner</p>
                        <p className="text-indigo-900 font-medium">{activePartnerName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Select Actual Member (For AF only) */}
              {userRole === 'area-franchise' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      3. Select Specific {selectedMemberType === 'dgc' ? 'DGC' : 'Core Member'}
                    </label>
                  </div>

                  <Select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    options={[
                      { value: '', label: `All ${selectedMemberType === 'dgc' ? 'DGCs' : 'Core Members'} (General Policy)` },
                      ...(selectedMemberType === 'dgc' ? dgcMembers : coreMembers).map(m => ({
                        value: m.userId || '',
                        label: `${m.name || 'Unknown'} (${m.membershipType || 'N/A'})`
                      }))
                    ]}
                  />

                  {selectedAreaId && (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                          <FiUser className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-green-500 font-bold uppercase">Selected {selectedMemberType === 'dgc' ? 'DGC' : 'Core Member'}</p>
                          <p className="text-green-900 font-medium">{activePartnerName}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Allocation Section (Role Dependent) */}
              <div className="relative border-l-2 border-dashed border-gray-300 pl-6 ml-4 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    {userRole === 'master-franchise' ? '3. Area Commission Allocation' :
                      userRole === 'area-franchise' ? `4. ${selectedMemberType === 'dgc' ? 'DGC' : 'Core Member'} Commission Allocation` :
                        '3. Network Commission Allocation'}
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    {userRole === 'master-franchise' ? "Define how much of YOUR share is passed to this Area Partner." :
                      userRole === 'area-franchise' ? `Define how much of YOUR share is passed to ${selectedMemberType === 'dgc' ? 'DGCs' : 'Core Members'} who refer.` :
                        "Define the total percentage allocated to the Franchise Network."}
                  </p>

                  <div className="bg-white p-6 rounded-xl border-2 border-indigo-100 shadow-sm transition-all hover:border-indigo-300 group">

                    {/* Header for Allocation Box */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          <FiPieChart className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {userRole === 'master-franchise' ? 'Area Partner Share' :
                              userRole === 'area-franchise' ? `${selectedMemberType === 'dgc' ? 'DGC' : 'Core Member'} Share` :
                                'Total Network Share'}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {(userRole === 'master-franchise' || userRole === 'area-franchise') ? 'Percentage of YOUR received pool' : 'Allocated to Master Franchise'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-indigo-600">
                          {userRole === 'master-franchise' || userRole === 'area-franchise' ? areaShare : networkShare}%
                        </span>
                      </div>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100" // Always 0-100% relative
                      step={1}
                      value={userRole === 'master-franchise' || userRole === 'area-franchise' ? areaShare : networkShare}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (userRole === 'master-franchise' || userRole === 'area-franchise') setAreaShare(val);
                        else setNetworkShare(val);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />

                    {/* Numeric Inputs */}
                    <div className="mt-4 flex gap-4">
                      <div className="flex-1">
                        <Input
                          label="Percentage (%)"
                          placeholder="Enter percentage"
                          type="number"
                          value={userRole === 'master-franchise' || userRole === 'area-franchise' ? areaShare : networkShare}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (userRole === 'master-franchise' || userRole === 'area-franchise') setAreaShare(val);
                            else setNetworkShare(val);
                          }}
                        />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded border border-gray-100 flex flex-col items-center justify-center text-gray-600 font-mono">
                        <span className="text-xs text-gray-400 mb-1">Total Payout</span>
                        <span className="font-bold text-indigo-600">
                          {userRole === 'master-franchise' || userRole === 'area-franchise'
                            ? `₹${(((exampleAmount * networkShare) / 100) * (areaShare / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                            : `₹${((exampleAmount * networkShare) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Net Earnings Display for MF/AF */}
                    {(userRole === 'master-franchise' || userRole === 'area-franchise') && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                          <span className="text-sm font-semibold text-green-800">Your Net Earnings:</span>
                          <div className="text-right">
                            <span className="font-bold text-green-700">{Math.max(0, 100 - areaShare)}%</span>
                            <p className="text-xs text-green-600">
                              ₹{(((exampleAmount * networkShare) / 100) * (1 - areaShare / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-100">
                <Button variant="primary" type="submit" loading={loading} className="px-8">
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>

            </form>
          </Card>
        </div>

        {/* Sidebar / Info Panel (Simulated for context) */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
              <FiAlertCircle />
              <span>Commission Rules</span>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed mb-4">
              {userRole === 'master-franchise' ? (
                "As a Zone Partner, you receive a fixed percentage from the Admin. You can then allocate a portion of your earnings to Area Partners to incentivize them."
              ) : userRole === 'area-franchise' ? (
                <>
                  As an Area Partner, you receive commission from the Zone Partner. You can allocate portions to:
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li><strong>Core Members</strong> who refer Flagship/Industria/Premium memberships</li>
                    <li><strong>DGCs (Digital Chapter Partners)</strong> who refer Digital memberships</li>
                  </ul>
                </>
              ) : (
                "Global settings affect the entire franchise network. Zone Partners receive this percentage and distribute it further to Area Partners."
              )}
            </p>
            {userRole === 'admin' && (
              <div className="text-xs text-blue-600 bg-white p-2 rounded border border-blue-100">
                <strong>Hierarchy:</strong> Admin → Master Franchise → Area Franchise → Core Member
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionSettings;

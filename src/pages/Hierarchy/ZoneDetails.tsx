import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';

import { Table, Button, Modal, Input, Badge, Card, Breadcrumb } from '../../components/shared';
import { getZoneById } from '../../api/zoneApi';
import { getAreasByZone, createArea, updateArea, deleteArea, assignAreaFranchise, Area } from '../../api/areaApi';
import { getUsersByRole, FranchiseUser, createFranchiseUser, CreateFranchiseData } from '../../api/franchiseApi';
import { toast } from 'react-toastify';

const ZoneDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [areaName, setAreaName] = useState('');
    const [capacity, setCapacity] = useState(100);
    const [description, setDescription] = useState('');
    const [pincode, setPincode] = useState('');

    // API area suggestions
    const [apiAreas, setApiAreas] = useState<any[]>([]);
    const [selectedApiArea, setSelectedApiArea] = useState<any>(null);
    const [loadingApiAreas, setLoadingApiAreas] = useState(false);

    // Step 2: Partner assignment modal
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [newlyCreatedAreaId, setNewlyCreatedAreaId] = useState<string | null>(null);
    const [partnerAssignmentMode, setPartnerAssignmentMode] = useState<'select' | 'create'>('select');
    const [step2SelectedPartner, setStep2SelectedPartner] = useState<any>(null);

    // New partner form fields
    const [newPartnerFname, setNewPartnerFname] = useState('');
    const [newPartnerLname, setNewPartnerLname] = useState('');
    const [newPartnerEmail, setNewPartnerEmail] = useState('');
    const [newPartnerMobile, setNewPartnerMobile] = useState('');
    const [newPartnerPassword, setNewPartnerPassword] = useState('');

    // Zipcodebase API Key
    const ZIPCODEBASE_API_KEY = import.meta.env.VITE_ZIPCODEBASE_API_KEY || 'YOUR_API_KEY_HERE';

    // Queries
    const { data: zone, isLoading: zoneLoading } = useQuery({
        queryKey: ['zone', id],
        queryFn: () => getZoneById(id!),
        enabled: !!id,
    });

    const { data: areas = [], isLoading: areasLoading } = useQuery({
        queryKey: ['areas', id],
        queryFn: () => getAreasByZone(id!),
        enabled: !!id,
    });

    // Fetch available Area Franchise users for this zone
    const { data: availableAreaFranchises = [] } = useQuery({
        queryKey: ['area-franchises-available', id],
        queryFn: async () => {
            if (!id) return [];
            const allAreaFranchises = await getUsersByRole('area-franchise');

            console.log('🔍 All Area Franchises:', allAreaFranchises);
            console.log('🎯 Looking for zone ID:', id);

            // Filter to get unassigned area franchises for this zone
            const filtered = allAreaFranchises.filter((af: FranchiseUser) => {
                const hasNoArea = !af.areaId;
                const belongsToZone = af.zoneId === id;

                console.log(`👤 ${af.fname} ${af.lname}: `, {
                    hasNoArea,
                    belongsToZone,
                    areaId: af.areaId,
                    zoneId: af.zoneId,
                    included: hasNoArea && belongsToZone
                });

                // Include if: no areaId (unassigned) AND belongs to this zone
                return hasNoArea && belongsToZone;
            });

            console.log('✅ Filtered Area Franchises:', filtered);
            return filtered;
        },
        enabled: !!id,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => createArea(id!, data),
        onSuccess: async (createdArea: any) => {
            queryClient.invalidateQueries({ queryKey: ['areas', id] });
            queryClient.invalidateQueries({ queryKey: ['zone', id] });

            toast.success('Area created successfully! Now assign a partner.');

            // Close Step 1 modal
            setIsModalOpen(false);

            // Open Step 2 modal for partner assignment
            setNewlyCreatedAreaId(createdArea._id);
            setIsPartnerModalOpen(true);

            // Reset Step 1 form but keep assignAfterCreation state
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create area');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateArea(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas', id] });
            toast.success('Area updated successfully');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update area');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (areaId: string) => deleteArea(areaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas', id] });
            queryClient.invalidateQueries({ queryKey: ['zone', id] });
            toast.success('Area deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete area');
        }
    });

    // Step 2: Create new Area Franchise partner (with areaId included)
    const createPartnerMutation = useMutation({
        mutationFn: (data: CreateFranchiseData) => createFranchiseUser(data),
        onSuccess: async (newPartner: FranchiseUser) => {
            console.log('✅ Partner created and assigned:', newPartner);
            // Partner is already assigned via areaId in the creation payload
            queryClient.invalidateQueries({ queryKey: ['areas', id] });
            queryClient.invalidateQueries({ queryKey: ['area-franchises-available', id] });
            toast.success(`Area Franchise partner "${newPartner.fname}" created and assigned successfully!`);
            closePartnerModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create partner');
        }
    });

    // Step 2: Assign existing partner
    const assignPartnerMutation = useMutation({
        mutationFn: (partnerId: string) => assignAreaFranchise(newlyCreatedAreaId!, partnerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas', id] });
            queryClient.invalidateQueries({ queryKey: ['area-franchises-available', id] });
            toast.success('Area Franchise partner assigned successfully!');
            closePartnerModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign partner');
        }
    });

    // Fetch API areas when zone is available (for new area creation)
    useEffect(() => {
        if (zone?.cityId && !editingId && isModalOpen) {
            const countryId = zone.countryId || 'India';
            fetchApiAreas(zone.cityId, countryId);
        }
    }, [zone, editingId, isModalOpen]);

    // Hybrid API fetching function (India Post + Zipcodebase fallback)
    const fetchApiAreas = async (cityName: string, countryName: string = 'India') => {
        setLoadingApiAreas(true);
        setApiAreas([]);
        setSelectedApiArea(null);

        console.log(`🌍 Fetching areas for city: "${cityName}" in country: "${countryName}"`);

        try {
            // Step 1: Try FREE India Post Office API first (for Indian cities)
            const indiaApiUrl = `https://api.postalpincode.in/postoffice/${encodeURIComponent(cityName)}`;
            console.log('🇮🇳 Trying India Post Office API...');
            const indiaResponse = await fetch(indiaApiUrl);
            const indiaData = await indiaResponse.json();

            if (indiaResponse.ok && indiaData[0]?.Status === 'Success' && indiaData[0]?.PostOffice?.length > 0) {
                const postOffices = indiaData[0].PostOffice;
                const areasFromApi: any[] = [];
                const areaMap = new Map();

                postOffices.forEach((po: any) => {
                    const areaName = po.Name;
                    const pincode = po.Pincode;
                    if (areaName && pincode && !areaMap.has(areaName)) {
                        areaMap.set(areaName, pincode);
                        areasFromApi.push({
                            label: `${areaName} (${pincode})`,
                            value: areaName,
                            pincode: pincode,
                        });
                    }
                });

                console.log(`✅ India API Success! Found ${areasFromApi.length} areas`);
                setApiAreas(areasFromApi);
                toast.success(`Found ${areasFromApi.length} areas in ${cityName} (India)!`);
                setLoadingApiAreas(false);
                return;
            }

            console.log('⚠️ India API returned no results, trying international API...');

            // Step 2: India API failed, try Zipcodebase API (for international cities)
            const countryCodeMap: any = {
                'India': 'IN',
                'UAE': 'AE',
                'United Arab Emirates': 'AE',
                'USA': 'US',
                'United States': 'US',
                'UK': 'GB',
                'United Kingdom': 'GB',
                'Canada': 'CA',
                'Australia': 'AU',
                'Singapore': 'SG',
                'Germany': 'DE',
                'France': 'FR',
                'Italy': 'IT',
                'Spain': 'ES',
                'Netherlands': 'NL',
                'Belgium': 'BE',
                'Switzerland': 'CH',
                'Austria': 'AT',
                'Sweden': 'SE',
                'Norway': 'NO',
                'Denmark': 'DK',
                'Finland': 'FI',
            };

            const countryCode = countryCodeMap[countryName] || 'IN';
            const zipcodeApiUrl = `https://app.zipcodebase.com/api/v1/search?apikey=${ZIPCODEBASE_API_KEY}&city=${encodeURIComponent(cityName)}&country=${countryCode}`;

            console.log(`🌐 Trying Zipcodebase API for country code: ${countryCode}`);
            const zipcodeResponse = await fetch(zipcodeApiUrl);
            const zipcodeData = await zipcodeResponse.json();

            if (zipcodeResponse.ok && zipcodeData.results && Object.keys(zipcodeData.results).length > 0) {
                const areasFromApi: any[] = [];
                const areaMap = new Map();

                Object.entries(zipcodeData.results).forEach(([pincode, locations]: [string, any]) => {
                    locations.forEach((loc: any) => {
                        const areaName = loc.province_en || loc.city_en || loc.state_en;
                        if (areaName && !areaMap.has(areaName)) {
                            areaMap.set(areaName, pincode);
                            areasFromApi.push({
                                label: `${areaName} (${pincode})`,
                                value: areaName,
                                pincode: pincode,
                            });
                        }
                    });
                });

                console.log(`✅ Zipcodebase API Success! Found ${areasFromApi.length} areas`);
                setApiAreas(areasFromApi);
                toast.success(`Found ${areasFromApi.length} areas in ${cityName}!`);
                setLoadingApiAreas(false);
                return;
            }

            // Both APIs failed
            console.log('❌ Both APIs returned no results');
            setApiAreas([]);
            toast.info(`No areas found for "${cityName}". Please enter manually.`);
        } catch (error: any) {
            console.error('❌ Error fetching API areas:', error);
            setApiAreas([]);
            toast.warning('API unavailable. Please enter area manually.');
        } finally {
            setLoadingApiAreas(false);
        }
    };

    // Handle API area selection
    const handleApiAreaSelection = (option: any) => {
        setSelectedApiArea(option);
        if (option) {
            setAreaName(option.value);
            setPincode(option.pincode);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!areaName) {
            toast.error('Please enter area name');
            return;
        }

        const payload = {
            areaName,
            capacity,
            boundaries: {
                description
            },
            metadata: {
                pinCodes: pincode ? pincode.split(',').map(p => p.trim()) : []
            }
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (area: Area) => {
        setEditingId(area._id);
        setAreaName(area.areaName);
        setCapacity(area.capacity || 100);
        setDescription(area.boundaries?.description || '');
        setPincode(area.metadata?.pinCodes?.join(', ') || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (areaId: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            deleteMutation.mutate(areaId);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setAreaName('');
        setCapacity(100);
        setDescription('');
        setPincode('');
        setApiAreas([]);
        setSelectedApiArea(null);
    };

    const resetPartnerForm = () => {
        setNewPartnerFname('');
        setNewPartnerLname('');
        setNewPartnerEmail('');
        setNewPartnerMobile('');
        setNewPartnerPassword('');
        setStep2SelectedPartner(null);
    };

    const closePartnerModal = () => {
        setIsPartnerModalOpen(false);
        setNewlyCreatedAreaId(null);
        setPartnerAssignmentMode('select');
        resetPartnerForm();
    };

    // Handle Step 2 partner assignment submission
    const handlePartnerAssignment = (e: React.FormEvent) => {
        e.preventDefault();

        if (partnerAssignmentMode === 'select') {
            // Assign existing partner
            if (!step2SelectedPartner) {
                toast.error('Please select a partner to assign');
                return;
            }
            assignPartnerMutation.mutate(step2SelectedPartner.value);
        } else {
            // Create new partner
            if (!newPartnerFname || !newPartnerEmail || !newPartnerMobile || !newPartnerPassword) {
                toast.error('Please fill all required fields');
                return;
            }

            const newPartnerData: CreateFranchiseData = {
                fname: newPartnerFname,
                lname: newPartnerLname,
                email: newPartnerEmail,
                mobile: newPartnerMobile,
                password: newPartnerPassword,
                role: 'area-franchise',
                zoneId: id!, // Assign to current zone
                areaId: newlyCreatedAreaId!, // Assign to newly created area
                city: zone?.cityId,
                state: zone?.stateId,
                country: zone?.countryId,
            };

            createPartnerMutation.mutate(newPartnerData);
        }
    };

    const columns = [
        {
            key: 'areaName',
            label: 'Area Name',
            render: (area: Area) => (
                <span className="font-medium">{area.areaName}</span>
            )
        },
        {
            key: 'areaCode',
            label: 'Area Code',
            render: (area: Area) => (
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{area.areaCode}</code>
            )
        },
        {
            key: 'pincode',
            label: 'Pincode',
            render: (area: Area) => (
                <span className="text-sm text-gray-600">
                    {area.metadata?.pinCodes && area.metadata.pinCodes.length > 0
                        ? area.metadata.pinCodes.join(', ')
                        : 'N/A'}
                </span>
            )
        },
        {
            key: 'areaFranchise',
            label: 'Area Franchise',
            render: (area: Area) => (
                area.areaFranchise ? (
                    <div className="text-sm">
                        <div className="font-medium">{area.areaFranchise.name}</div>
                        <div className="text-gray-500">{area.areaFranchise.email}</div>
                    </div>
                ) : (
                    <Badge variant="default">Unassigned</Badge>
                )
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (area: Area) => (
                <Badge variant={area.status === 'active' ? 'success' : 'default'}>
                    {area.status ? area.status.toUpperCase() : 'ACTIVE'}
                </Badge>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (area: Area) => (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handleEdit(area)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(area._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (zoneLoading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading zone details...</div>
                </div>
            </div>
        );
    }

    if (!zone) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">Zone not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Hierarchy', href: '/hierarchy/zones' },
                    { label: 'Zones', href: '/hierarchy/zones' },
                    { label: zone.zoneName }
                ]}
                className="mb-6"
            />

            <div className="mb-6">
                <Button
                    variant="secondary"
                    onClick={() => navigate('/hierarchy/zones')}
                    className="mb-4"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Zones
                </Button>
            </div>

            {/* Zone Information Card */}
            <Card title="Zone Information" className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Zone Name</label>
                        <p className="text-lg font-semibold">{zone.zoneName}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">City</label>
                        <p className="text-lg font-semibold">{zone.cityId}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">State</label>
                        <p className="text-lg font-semibold">{zone.stateId}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Country</label>
                        <p className="text-lg font-semibold">{zone.countryId}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="mt-1">
                            <Badge variant={zone.status === 'active' ? 'success' : 'warning'}>
                                {zone.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Total Areas</label>
                        <p className="text-lg font-semibold">{areas.length} / {zone.maxAreas || 'Unlimited'}</p>
                    </div>
                    {zone.assignedMFId && (
                        <>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">Master Franchise</label>
                                <div className="mt-1">
                                    <p className="font-semibold">{zone.assignedMFId.name}</p>
                                    <p className="text-sm text-gray-500">{zone.assignedMFId.email}</p>
                                    {zone.assignedMFId.phoneNumber && (
                                        <p className="text-sm text-gray-500">{zone.assignedMFId.phoneNumber}</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Areas Table */}
            <Card
                title="Areas in this Zone"
                subtitle={`Manage areas within ${zone.zoneName}`}
                headerAction={
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        + Add New Area
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    data={areas}
                    loading={areasLoading}
                    emptyMessage="No areas found in this zone. Create your first area to get started."
                />
            </Card>

            {/* Area Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Area" : "Create New Area"}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Zone Info Display */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Zone: {zone.zoneName}</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-blue-800">
                            <div>City: {zone.cityId}</div>
                            <div>State: {zone.stateId}</div>
                            <div>Country: {zone.countryId}</div>
                            {zone.assignedMFId && (
                                <div className="col-span-2 truncate" title={zone.assignedMFId.name}>
                                    MF: {zone.assignedMFId.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Area Name <span className="text-red-500">*</span>
                                {loadingApiAreas && <span className="text-blue-600 ml-2">(Loading areas...)</span>}
                            </label>
                            {apiAreas.length > 0 && !editingId ? (
                                <>
                                    <Select
                                        options={apiAreas}
                                        value={selectedApiArea}
                                        onChange={handleApiAreaSelection}
                                        placeholder="Select an area from API"
                                        isSearchable
                                        isClearable
                                        isDisabled={loadingApiAreas}
                                        isLoading={loadingApiAreas}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '42px',
                                                borderColor: '#e5e7eb',
                                            }),
                                        }}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Select from API suggestions or clear to enter manually
                                    </p>
                                </>
                            ) : (
                                <Input
                                    value={areaName}
                                    onChange={(e) => setAreaName(e.target.value)}
                                    required
                                    placeholder="e.g., Downtown"
                                    disabled={loadingApiAreas}
                                    helperText={
                                        editingId
                                            ? "Area name cannot be changed while editing"
                                            : "Enter area name manually"
                                    }
                                />
                            )}
                        </div>

                        <div>
                            <Input
                                type="text"
                                label="Capacity"
                                value={capacity.toString()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setCapacity(val === '' ? 0 : parseInt(val));
                                    }
                                }}
                                placeholder="100"
                                helperText="Max members (digits only)"
                            />
                        </div>

                        <div>
                            <Input
                                label="Pincode(s)"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder="e.g., 390001, 390002"
                                helperText={
                                    selectedApiArea
                                        ? "Auto-filled from selected area (you can modify)"
                                        : "Comma separated pincodes"
                                }
                            />
                        </div>

                        <div>
                            <Input
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the area"
                            />
                        </div>
                    </div>

                    {/* Info: Partner assignment happens in Step 2 */}
                    {!editingId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                💡 <strong>Next Step:</strong> After creating the area, you'll be able to assign an Area Franchise partner immediately.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!areaName || createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingId ? "Update Area" : "Create Area")}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Step 2: Partner Assignment Modal */}
            <Modal
                isOpen={isPartnerModalOpen}
                onClose={closePartnerModal}
                title="Step 2: Assign Area Franchise Partner"
                size="lg"
            >
                <form onSubmit={handlePartnerAssignment} className="space-y-6">
                    {/* Info banner */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 font-medium">
                            ✅ Area created successfully!
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Now choose to either select an existing unassigned Area Franchise partner or create a new one.
                        </p>
                    </div>

                    {/* Mode Selection: Radio buttons */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Choose Assignment Method</h4>
                        <div className="space-y-3">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="partnerMode"
                                    value="select"
                                    checked={partnerAssignmentMode === 'select'}
                                    onChange={() => {
                                        setPartnerAssignmentMode('select');
                                        resetPartnerForm();
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    📋 Select Existing Partner
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="partnerMode"
                                    value="create"
                                    checked={partnerAssignmentMode === 'create'}
                                    onChange={() => {
                                        setPartnerAssignmentMode('create');
                                        setStep2SelectedPartner(null);
                                    }}
                                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    ➕ Create New Partner
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Conditional Content based on mode */}
                    {partnerAssignmentMode === 'select' ? (
                        // Select existing partner
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Area Franchise Partner <span className="text-red-500">*</span>
                                </label>
                                {availableAreaFranchises.length > 0 ? (
                                    <>
                                        <Select
                                            options={availableAreaFranchises.map((af: FranchiseUser) => ({
                                                label: `${af.fname} ${af.lname || ''} (${af.email})`,
                                                value: af._id,
                                                user: af
                                            }))}
                                            value={step2SelectedPartner}
                                            onChange={(val) => setStep2SelectedPartner(val)}
                                            placeholder="Search for a partner..."
                                            isSearchable
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Only showing unassigned partners in this zone.
                                        </p>
                                    </>
                                ) : (
                                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-100">
                                        No unassigned Area Franchise partners found in this zone. Please create a new one.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Create new partner
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    value={newPartnerFname}
                                    onChange={(e) => setNewPartnerFname(e.target.value)}
                                    required
                                    placeholder="John"
                                />
                                <Input
                                    label="Last Name"
                                    value={newPartnerLname}
                                    onChange={(e) => setNewPartnerLname(e.target.value)}
                                    placeholder="Doe"
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={newPartnerEmail}
                                    onChange={(e) => setNewPartnerEmail(e.target.value)}
                                    required
                                    placeholder="john@example.com"
                                />
                                <Input
                                    label="Mobile Number"
                                    value={newPartnerMobile}
                                    onChange={(e) => setNewPartnerMobile(e.target.value)}
                                    required
                                    placeholder="+91 9876543210"
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={newPartnerPassword}
                                        onChange={(e) => setNewPartnerPassword(e.target.value)}
                                        required
                                        placeholder="Enter password"
                                        helperText="Minimum 6 characters"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <Button variant="secondary" onClick={closePartnerModal} type="button">
                            Skip Assignment
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                (partnerAssignmentMode === 'select' && !step2SelectedPartner) ||
                                (partnerAssignmentMode === 'create' && (!newPartnerFname || !newPartnerEmail || !newPartnerMobile || !newPartnerPassword)) ||
                                createPartnerMutation.isPending ||
                                assignPartnerMutation.isPending
                            }
                        >
                            {createPartnerMutation.isPending || assignPartnerMutation.isPending
                                ? 'Assigning...'
                                : partnerAssignmentMode === 'create' ? 'Create & Assign Partner' : 'Assign Partner'
                            }
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ZoneDetails;

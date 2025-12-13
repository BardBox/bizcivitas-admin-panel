import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Table, Button, Modal, Input, Badge, Card, Breadcrumb } from '../../components/shared';
import { getAllAreas, createArea, updateArea, deleteArea, assignAreaFranchise, Area } from '../../api/areaApi';
import { getUsersByRole, FranchiseUser, createFranchiseUser, CreateFranchiseData } from '../../api/franchiseApi';
import { getAllZones, Zone } from '../../api/zoneApi';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { getUserFromLocalStorage } from '../../api/auth';

const AreaList: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const user = getUserFromLocalStorage();
    const isMasterFranchise = user?.role === 'master-franchise';

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [areaName, setAreaName] = useState('');
    const [capacity, setCapacity] = useState(100);
    const [description, setDescription] = useState('');
    const [pincode, setPincode] = useState('');

    // Step 2: Partner assignment modal
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [newlyCreatedAreaId, setNewlyCreatedAreaId] = useState<string | null>(null);
    const [step2Zone, setStep2Zone] = useState<any>(null);
    const [partnerAssignmentMode, setPartnerAssignmentMode] = useState<'select' | 'create'>('select');
    const [step2SelectedPartner, setStep2SelectedPartner] = useState<any>(null);

    // New partner form fields
    const [newPartnerFname, setNewPartnerFname] = useState('');
    const [newPartnerLname, setNewPartnerLname] = useState('');
    const [newPartnerEmail, setNewPartnerEmail] = useState('');
    const [newPartnerMobile, setNewPartnerMobile] = useState('');
    const [newPartnerPassword, setNewPartnerPassword] = useState('');

    // Removed: API area suggestions (no longer needed)

    // Queries
    const { data: areas = [], isLoading: areasLoading } = useQuery({
        queryKey: ['areas'],
        queryFn: () => getAllAreas(),
    });

    const { data: zones = [] } = useQuery({
        queryKey: ['zones'],
        queryFn: () => getAllZones(),
    });

    // Determine active zone ID for fetching partners
    const activeZoneId = isPartnerModalOpen ? step2Zone?.value : selectedZone?.value;

    // Fetch available Area Franchise users for the selected zone
    const { data: availableAreaFranchises = [] } = useQuery({
        queryKey: ['area-franchises-available', activeZoneId],
        queryFn: async () => {
            if (!activeZoneId) return [];
            const allAreaFranchises = await getUsersByRole('area-franchise');

            // Filter to get unassigned area franchises for this zone
            return allAreaFranchises.filter((af: FranchiseUser) => {
                const hasNoArea = !af.areaId;
                const belongsToZone = af.zoneId === activeZoneId;
                return hasNoArea && belongsToZone;
            });
        },
        enabled: !!activeZoneId,
    });

    // Removed: API area fetching useEffect (no longer needed)

    // Auto-select zone for Master Franchise
    useEffect(() => {
        if (isMasterFranchise && user?.zoneId && zones.length > 0 && !selectedZone) {
            const userZoneId = typeof user.zoneId === 'object' ? user.zoneId._id : user.zoneId;
            const zone = zones.find((z: Zone) => z._id === userZoneId);
            if (zone) {
                setSelectedZone({
                    label: `${zone.zoneName} (${zone.cityId})`,
                    value: zone._id,
                    zone: zone
                });
            }
        }
    }, [isMasterFranchise, user, zones, selectedZone]);

    // Removed: fetchApiAreas function (no longer needed)

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => createArea(data.zoneId, data.payload),
        onSuccess: (createdArea: any) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Area created successfully! Now assign a partner.');

            // Close Step 1 modal
            setIsModalOpen(false);

            // Open Step 2 modal for partner assignment
            setNewlyCreatedAreaId(createdArea._id);
            setStep2Zone(selectedZone); // Save zone for step 2
            setIsPartnerModalOpen(true);

            // Reset Step 1 form
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create area');
        }
    });

    // Step 2: Create new Area Franchise partner (with areaId included)
    const createPartnerMutation = useMutation({
        mutationFn: (data: CreateFranchiseData) => createFranchiseUser(data),
        onSuccess: async (newPartner: FranchiseUser) => {
            // Partner is already assigned via areaId in the creation payload
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            queryClient.invalidateQueries({ queryKey: ['area-franchises-available', activeZoneId] });
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
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            queryClient.invalidateQueries({ queryKey: ['area-franchises-available', activeZoneId] });
            toast.success('Area Franchise partner assigned successfully!');
            closePartnerModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign partner');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateArea(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Area updated successfully');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update area');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteArea(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Area deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete area');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedZone || !areaName) {
            toast.error('Please select a zone and enter area name');
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
            createMutation.mutate({ zoneId: selectedZone.value, payload });
        }
    };

    const handleEdit = (area: Area) => {
        setEditingId(area._id);
        setAreaName(area.areaName);
        setCapacity(area.capacity || 100);
        setDescription(area.boundaries?.description || '');
        setPincode(area.metadata?.pinCodes?.join(', ') || '');

        const zone = zones.find((z: Zone) => z._id === area.zoneId?._id);
        if (zone) {
            setSelectedZone({
                label: `${zone.zoneName} (${zone.cityId})`,
                value: zone._id,
                zone: zone
            });
        }

        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
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
            deleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        if (!isMasterFranchise) {
            setSelectedZone(null);
        }
        setAreaName('');
        setCapacity(100);
        setDescription('');
        setPincode('');
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
        setStep2Zone(null); // Clear step 2 zone
        setPartnerAssignmentMode('select');
        resetPartnerForm();
    };

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

            // Use step2Zone if available, otherwise fallback to selectedZone (though selectedZone might be null)
            const zoneForAssignment = step2Zone || selectedZone;

            if (!zoneForAssignment) {
                toast.error('Zone information missing');
                return;
            }

            const newPartnerData: CreateFranchiseData = {
                fname: newPartnerFname,
                lname: newPartnerLname,
                email: newPartnerEmail,
                mobile: newPartnerMobile,
                password: newPartnerPassword,
                role: 'area-franchise',
                zoneId: zoneForAssignment.value, // Assign to current zone
                areaId: newlyCreatedAreaId!, // Assign to newly created area
                city: zoneForAssignment.zone.cityId,
                state: zoneForAssignment.zone.stateId,
                country: zoneForAssignment.zone.countryId,
            };

            createPartnerMutation.mutate(newPartnerData);
        }
    };

    // Removed: handleApiAreaSelection function (no longer needed)

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
            key: 'zone',
            label: 'Zone',
            render: (area: Area) => (
                <span>{area.zoneId?.zoneName || 'N/A'}</span>
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
            key: 'city',
            label: 'City',
            render: (area: Area) => (
                <span>{area.zoneId?.cityId || 'N/A'}</span>
            )
        },
        {
            key: 'areaFranchise',
            label: 'Area Franchise',
            render: (area: Area) => (
                area.areaFranchise ? (
                    <div className="text-sm">
                        <div className="font-medium">{area.areaFranchise.fname} {area.areaFranchise.lname}</div>
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

    // Options for Zone Select
    const zoneOptions = zones.map((zone: Zone) => ({
        label: `${zone.zoneName} (${zone.cityId})`,
        value: zone._id,
        zone: zone
    }));

    return (
        <div className="p-6">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Hierarchy', href: '/hierarchy/zones' },
                    { label: 'Areas' }
                ]}
                className="mb-6"
            />

            <Card
                title="Area Management"
                subtitle="Manage areas across all zones"
                headerAction={
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        + Create New Area
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    data={areas}
                    loading={areasLoading}
                    emptyMessage="No areas found. Create your first area to get started."
                />
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Area" : "Create New Area"}
                size="xl"
                bodyPadding="p-4"
                headerPadding="p-4"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Zone Selection */}
                        <div className={selectedZone ? "" : "md:col-span-2"}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Zone <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={zoneOptions}
                                value={selectedZone}
                                onChange={(val) => setSelectedZone(val)}
                                placeholder="Select a zone for this area"
                                isSearchable
                                isDisabled={!!editingId || isMasterFranchise} // Disable zone selection when editing or if Master Franchise
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                {editingId
                                    ? "Zone cannot be changed while editing"
                                    : isMasterFranchise
                                        ? "You can only create areas in your assigned zone"
                                        : "Choose the zone (city) where this area will be located"}
                            </p>
                        </div>

                        {/* Selected Zone Details - Side by Side with Dropdown */}
                        {selectedZone && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm h-full">
                                <h4 className="font-semibold text-blue-900 mb-1">Selected Zone: {selectedZone.zone.zoneName}</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-800">
                                    <div>City: {selectedZone.zone.cityId}</div>
                                    <div>State: {selectedZone.zone.stateId}</div>
                                    <div>Country: {selectedZone.zone.countryId}</div>
                                    {selectedZone.zone.assignedMFId && (
                                        <div className="col-span-2 truncate" title={selectedZone.zone.assignedMFId.name}>
                                            MF: {selectedZone.zone.assignedMFId.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Area Name - Manual Entry Only */}
                        <div>
                            <Input
                                label="Area Name"
                                value={areaName}
                                onChange={(e) => setAreaName(e.target.value)}
                                required
                                placeholder="e.g., Downtown, Jawahar Nagar, MG Road"
                                disabled={!!editingId}
                                helperText={
                                    editingId
                                        ? "Area name cannot be changed while editing"
                                        : "Enter the area/locality name"
                                }
                            />
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

                        {/* Pincode & Description */}
                        <div>
                            <Input
                                label="Pincode(s)"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder="e.g., 390001, 390002"
                                helperText="Enter comma-separated pincodes for this area"
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

                    <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!selectedZone || !areaName || createMutation.isPending || updateMutation.isPending}>
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
                bodyPadding="p-4"
                headerPadding="p-4"
            >
                <form onSubmit={handlePartnerAssignment} className="space-y-4">
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
                                                partner: af
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

                    <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
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

export default AreaList;

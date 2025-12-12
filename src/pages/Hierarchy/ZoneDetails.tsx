import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Table, Button, Modal, Input, Badge, Card, Breadcrumb } from '../../components/shared';
import { getZoneById } from '../../api/zoneApi';
import { getAreasByZone, createArea, updateArea, deleteArea, Area } from '../../api/areaApi';
import { createFranchiseUser, CreateFranchiseData } from '../../api/franchiseApi';
import { toast } from 'react-toastify';
import FranchisePartnerModal from '../../components/franchise/FranchisePartnerModal';

const ZoneDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isZonePartnerModalOpen, setIsZonePartnerModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [areaName, setAreaName] = useState('');
    const [capacity, setCapacity] = useState(100);
    const [description, setDescription] = useState('');
    const [pincode, setPincode] = useState('');

    // Step 2: Partner assignment modal
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [newlyCreatedAreaId, setNewlyCreatedAreaId] = useState<string | null>(null);

    // New partner form fields
    const [newPartnerFname, setNewPartnerFname] = useState('');
    const [newPartnerLname, setNewPartnerLname] = useState('');
    const [newPartnerEmail, setNewPartnerEmail] = useState('');
    const [newPartnerMobile, setNewPartnerMobile] = useState('');
    const [newPartnerPassword, setNewPartnerPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Removed: Zipcodebase API Key (no longer needed)

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
        onSuccess: async (newPartner: any) => {
            console.log('✅ Partner created and assigned:', newPartner);
            // Partner is already assigned via areaId in the creation payload
            queryClient.invalidateQueries({ queryKey: ['areas', id] });
            toast.success(`Area Franchise partner "${newPartner.fname || 'Partner'}" created and assigned successfully!`);
            closePartnerModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create partner');
        }
    });

    // Removed: API area fetching and selection handlers (no longer needed)

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
            // Update area details first
            updateMutation.mutate({ id: editingId, payload }, {
                onSuccess: async () => {
                    // After area update, handle partner update/creation if details provided
                    if (newPartnerFname && newPartnerEmail && newPartnerMobile) {
                        // Only require password if creating new partner (no existing email was pre-filled)
                        const isCreatingNew = !newPartnerEmail; // If email wasn't pre-filled, it's a new partner

                        if (isCreatingNew && !newPartnerPassword) {
                            toast.error('Password is required for new partner');
                            return;
                        }

                        const partnerData: CreateFranchiseData = {
                            fname: newPartnerFname,
                            lname: newPartnerLname,
                            email: newPartnerEmail,
                            mobile: newPartnerMobile,
                            password: newPartnerPassword || 'placeholder', // Backend should handle update vs create
                            role: 'area-franchise',
                            zoneId: id!,
                            areaId: editingId,
                            city: zone?.cityId,
                            state: zone?.stateId,
                            country: zone?.countryId,
                        };

                        try {
                            await createFranchiseUser(partnerData);
                            toast.success('Area and partner updated successfully');
                        } catch (error: any) {
                            toast.error(error.response?.data?.message || 'Failed to update partner');
                        }
                    }

                    // Refresh data
                    queryClient.invalidateQueries({ queryKey: ['areas', id] });
                }
            });
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

        // Pre-fill partner details if assigned
        if (area.areaFranchise) {
            setNewPartnerFname(area.areaFranchise.fname || '');
            setNewPartnerLname(area.areaFranchise.lname || '');
            setNewPartnerEmail(area.areaFranchise.email || '');
            setNewPartnerMobile(area.areaFranchise.phoneNumber || '');
            // Note: Password won't be pre-filled for security reasons
        }

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
        resetPartnerForm();
    };

    const resetPartnerForm = () => {
        setNewPartnerFname('');
        setNewPartnerLname('');
        setNewPartnerEmail('');
        setNewPartnerMobile('');
        setNewPartnerPassword('');
    };

    const closePartnerModal = () => {
        setIsPartnerModalOpen(false);
        setNewlyCreatedAreaId(null);
        resetPartnerForm();
    };

    // Handle Step 2 partner assignment submission
    const handlePartnerAssignment = (e: React.FormEvent) => {
        e.preventDefault();

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
                        <div className="font-medium">{area.areaFranchise.fname} {area.areaFranchise.lname}</div>
                        <div className="text-gray-500">{area.areaFranchise.email}</div>
                    </div>
                ) : (
                    <Badge variant="default">Unassigned</Badge>
                )
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
                        <label className="text-sm font-medium text-gray-600">Cities</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {zone.cities && zone.cities.length > 0 ? (
                                zone.cities.map((city: string, index: number) => (
                                    <Badge key={index} variant="default">
                                        {city}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-lg font-semibold">{zone.cityId}</p>
                            )}
                        </div>
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
                        <label className="text-sm font-medium text-gray-600">Zone Partner</label>
                        <div className="mt-1 flex items-center gap-2">
                            <Badge variant={zone.assignedMFId ? 'success' : 'warning'}>
                                {zone.assignedMFId ? 'ASSIGNED' : 'NOT ASSIGNED'}
                            </Badge>
                            {!zone.assignedMFId && (
                                <button
                                    onClick={() => setIsZonePartnerModalOpen(true)}
                                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    title="Create Zone Partner"
                                >
                                    <UserPlus size={14} />
                                </button>
                            )}
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
                                    <p className="font-semibold">{zone.assignedMFId.fname} {zone.assignedMFId.lname}</p>
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
                            <div>Cities: {zone.cities && zone.cities.length > 0 ? zone.cities.join(', ') : zone.cityId}</div>
                            <div>State: {zone.stateId}</div>
                            <div>Country: {zone.countryId}</div>
                            {zone.assignedMFId && (
                                <div className="col-span-2 truncate" title={`${zone.assignedMFId.fname} ${zone.assignedMFId.lname}`}>
                                    MF: {zone.assignedMFId.fname} {zone.assignedMFId.lname}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <div>
                            <Input
                                label="Pincode(s)"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder="e.g., 390001"
                                helperText="Enter pincode for this area"
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

                    {/* Partner Assignment Section - Only for Edit Mode */}
                    {editingId && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Area Franchise Partner</h3>

                            {/* Info box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <span className="text-2xl mr-3">ℹ️</span>
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">Update Area Partner</h4>
                                        <p className="text-sm text-blue-700">
                                            {newPartnerFname || newPartnerEmail
                                                ? "Modify the existing partner's details below or create a new partner."
                                                : "Create a new Area Franchise partner to manage this area."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Partner Form */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="First Name"
                                        value={newPartnerFname}
                                        onChange={(e) => setNewPartnerFname(e.target.value)}
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
                                        placeholder="john@example.com"
                                    />
                                    <Input
                                        label="Mobile Number"
                                        value={newPartnerMobile}
                                        onChange={(e) => setNewPartnerMobile(e.target.value)}
                                        placeholder="+91 9876543210"
                                    />
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={newPartnerPassword}
                                                onChange={(e) => setNewPartnerPassword(e.target.value)}
                                                placeholder={newPartnerEmail ? "Leave empty to keep current password" : "Enter password"}
                                                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {newPartnerEmail ? "Only fill if you want to change the password" : "Minimum 6 characters"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!areaName || createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : (editingId
                                    ? ((newPartnerFname || newPartnerEmail || newPartnerMobile)
                                        ? "Update Area & Partner"
                                        : "Update Area")
                                    : "Create Area")
                            }
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

                    {/* Info box - Only creating new partner for new areas */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <span className="text-2xl mr-3">ℹ️</span>
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Creating Area Franchise Partner</h4>
                                <p className="text-sm text-blue-700">
                                    Since this is a new area, you'll need to create a new Area Franchise partner to manage it.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Create new partner form */}
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

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <Button variant="secondary" onClick={closePartnerModal} type="button">
                            Skip Assignment
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                !newPartnerFname || !newPartnerEmail || !newPartnerMobile || !newPartnerPassword ||
                                createPartnerMutation.isPending
                            }
                        >
                            {createPartnerMutation.isPending
                                ? 'Creating Partner...'
                                : 'Create & Assign Partner'
                            }
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Zone Partner Modal */}
            <FranchisePartnerModal
                isOpen={isZonePartnerModalOpen}
                onClose={() => setIsZonePartnerModalOpen(false)}
                prefilledRole="master-franchise"
                prefilledZoneId={id}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['zone', id] });
                    queryClient.invalidateQueries({ queryKey: ['zones'] });
                }}
            />
        </div>
    );
};

export default ZoneDetails;

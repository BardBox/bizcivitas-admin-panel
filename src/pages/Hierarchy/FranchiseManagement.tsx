import React, { useState } from 'react';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';

import { Table, Button, Modal, Input, Badge, Card, Breadcrumb } from '../../components/shared';
import { createFranchiseUser, getUsersByRole, updateFranchiseUser, deleteFranchiseUser, FranchiseUser } from '../../api/franchiseApi';
import { getAllZones, Zone } from '../../api/zoneApi';
import { getAllAreas, Area } from '../../api/areaApi';
import { toast } from 'react-toastify';
import { getUserFromLocalStorage } from '../../api/auth';

const FranchiseManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const user = getUserFromLocalStorage();
    const isMasterFranchise = user?.role === 'master-franchise';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewRole, setViewRole] = useState<'master-franchise' | 'area-franchise'>(
        isMasterFranchise ? 'area-franchise' : 'master-franchise'
    );

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'master-franchise' | 'area-franchise'>(
        isMasterFranchise ? 'area-franchise' : 'master-franchise'
    );
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [selectedArea, setSelectedArea] = useState<any>(null);

    // Queries
    const { data: franchiseUsers = [], isLoading: usersLoading } = useQuery({
        queryKey: ['franchise-users', viewRole],
        queryFn: () => getUsersByRole(viewRole),
    });

    const { data: zones = [] } = useQuery({
        queryKey: ['zones'],
        queryFn: () => getAllZones(),
    });

    const { data: areas = [] } = useQuery({
        queryKey: ['areas', selectedZone?.value],
        queryFn: () => {
            // Only fetch areas if a zone is selected
            if (!selectedZone?.value) return [];
            return getAllAreas();
        },
        enabled: !!selectedZone?.value && role === 'area-franchise',
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => createFranchiseUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['franchise-users'] });
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Franchise partner created successfully');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create franchise partner');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateFranchiseUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['franchise-users'] });
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Franchise partner updated successfully');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update franchise partner');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteFranchiseUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['franchise-users'] });
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Franchise partner deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete franchise partner');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!fname || !email || !mobile || !role) {
            toast.error('Please fill all required fields');
            return;
        }

        // Password is required only for creating new users
        if (!editingId && !password) {
            toast.error('Password is required for new users');
            return;
        }

        if (role === 'master-franchise' && !selectedZone) {
            toast.error('Please select a zone for Master Franchise');
            return;
        }

        if (role === 'area-franchise' && !selectedArea) {
            toast.error('Please select an area for Area Franchise');
            return;
        }

        const payload: any = {
            fname,
            lname,
            email,
            mobile,
            role
        };

        // Only include password if provided (required for create, optional for update)
        if (password) {
            payload.password = password;
        }

        if (role === 'master-franchise' && selectedZone) {
            payload.zoneId = selectedZone.value;
            payload.country = selectedZone.zone.countryId;
            payload.state = selectedZone.zone.stateId;
            payload.city = selectedZone.zone.cityId;
        }

        if (role === 'area-franchise' && selectedArea) {
            payload.areaId = selectedArea.value;
            payload.country = selectedArea.area.zoneId.countryId;
            payload.state = selectedArea.area.zoneId.stateId;
            payload.city = selectedArea.area.zoneId.cityId;
        }

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFname('');
        setLname('');
        setEmail('');
        setMobile('');
        setPassword('');
        setRole('master-franchise');
        setSelectedZone(null);
        setSelectedArea(null);
    };

    const handleCreateNew = () => {
        resetForm();
        setRole(viewRole);
        setIsModalOpen(true);
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (user: FranchiseUser) => (
                <div>
                    <div className="font-medium">{user.fname} {user.lname}</div>
                    <div className="text-sm text-gray-500">{user.username}</div>
                </div>
            )
        },
        {
            key: 'email',
            label: 'Email',
            render: (user: FranchiseUser) => user.email
        },
        {
            key: 'mobile',
            label: 'Mobile',
            render: (user: FranchiseUser) => user.mobile
        },
        {
            key: 'role',
            label: 'Role',
            render: (user: FranchiseUser) => (
                <Badge variant="info">
                    {user.role === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'}
                </Badge>
            )
        },
        {
            key: 'location',
            label: 'Location',
            render: (user: any) => {
                // For Master Franchise, show Zone name
                if (user.role === 'master-franchise' && user.zoneId) {
                    const zoneName = typeof user.zoneId === 'object' ? user.zoneId.zoneName : user.city;
                    const city = typeof user.zoneId === 'object' ? user.zoneId.cityId : user.city;
                    return (
                        <div className="text-sm">
                            <div>{zoneName || city}</div>
                            {user.state && <div className="text-gray-500">{user.state}</div>}
                        </div>
                    );
                }
                // For Area Franchise, show Area name
                if (user.role === 'area-franchise' && user.areaId) {
                    const areaName = typeof user.areaId === 'object' ? user.areaId.areaName : null;
                    const zoneName = typeof user.areaId === 'object' && typeof user.areaId.zoneId === 'object' ? user.areaId.zoneId.zoneName : user.city;
                    return (
                        <div className="text-sm">
                            <div>{areaName}</div>
                            {zoneName && <div className="text-gray-500">{zoneName}</div>}
                        </div>
                    );
                }
                // Fallback to city/state
                return (
                    <div className="text-sm">
                        {user.city && <div>{user.city}</div>}
                        {user.state && <div className="text-gray-500">{user.state}</div>}
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (user: FranchiseUser) => (
                <Badge variant={user.isActive ? 'success' : 'default'}>
                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (user: FranchiseUser) => (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handleEdit(user)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(user._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const handleEdit = (user: any) => {
        setEditingId(user._id);
        setFname(user.fname);
        setLname(user.lname || '');
        setEmail(user.email);
        setMobile(user.mobile);
        setPassword(''); // Don't populate password for security
        setRole(user.role as 'master-franchise' | 'area-franchise');

        // Set zone/area based on role - use populated data if available
        if (user.role === 'master-franchise' && user.zoneId) {
            // Check if zoneId is populated (object) or just an ID (string)
            if (typeof user.zoneId === 'object' && user.zoneId._id) {
                // Already populated
                setSelectedZone({
                    label: `${user.zoneId.zoneName} (${user.zoneId.cityId})`,
                    value: user.zoneId._id,
                    zone: user.zoneId
                });
            } else {
                // Just an ID, find in zones list
                const zone = zones.find((z: Zone) => z._id === user.zoneId);
                if (zone) {
                    setSelectedZone({
                        label: `${zone.zoneName} (${zone.cityId})`,
                        value: zone._id,
                        zone: zone
                    });
                }
            }
        } else if (user.role === 'area-franchise' && user.areaId) {
            // Check if areaId is populated (object) or just an ID (string)
            if (typeof user.areaId === 'object' && user.areaId._id) {
                // Already populated
                setSelectedArea({
                    label: `${user.areaId.areaName} (${typeof user.areaId.zoneId === 'object' ? user.areaId.zoneId.zoneName : 'Unknown Zone'})`,
                    value: user.areaId._id,
                    area: user.areaId
                });
            } else {
                // Just an ID, find in areas list
                const area = areas.find((a: Area) => a._id === user.areaId);
                if (area) {
                    setSelectedArea({
                        label: `${area.areaName} (${area.zoneId.zoneName})`,
                        value: area._id,
                        area: area
                    });
                }
            }
        }

        setIsModalOpen(true);
    };

    const handleDelete = async (userId: string) => {
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
            deleteMutation.mutate(userId);
        }
    };

    // Options for Zone Select
    const zoneOptions = zones.map((zone: Zone) => ({
        label: `${zone.zoneName} (${zone.cityId})`,
        value: zone._id,
        zone: zone
    }));

    // Get all assigned area IDs from existing area franchise users
    const assignedAreaIds = new Set(
        franchiseUsers
            .filter((user: FranchiseUser) => user.role === 'area-franchise' && user.areaId)
            .map((user: FranchiseUser) => {
                // Handle both populated (object) and non-populated (string) areaId
                return typeof user.areaId === 'object' ? user.areaId._id : user.areaId;
            })
    );

    // When editing, allow the current area to be shown even if assigned
    const editingAreaId = editingId && role === 'area-franchise' && selectedArea?.value ? selectedArea.value : null;

    // Options for Area Select (only show if zone is selected, filtered by zone and excluding already assigned areas)
    const areaOptions = selectedZone
        ? areas
            .filter((area: Area) => {
                // Must match the selected zone
                const zoneId = typeof area.zoneId === 'object' ? area.zoneId._id : area.zoneId;
                const matchesZone = zoneId === selectedZone.value;
                // Exclude already assigned areas (except when editing the current area)
                const isAvailable = !assignedAreaIds.has(area._id) || area._id === editingAreaId;
                return matchesZone && isAvailable;
            })
            .map((area: Area) => ({
                label: `${area.areaName} (${typeof area.zoneId === 'object' ? area.zoneId.zoneName : 'Unknown Zone'})`,
                value: area._id,
                area: area
            }))
        : []; // Return empty array if no zone is selected

    return (
        <div className="p-6">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Hierarchy', href: '/hierarchy/zones' },
                    { label: 'Franchise Management' }
                ]}
                className="mb-6"
            />

            {/* View Toggle */}
            {!isMasterFranchise && (
                <div className="mb-6 flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">View:</label>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setViewRole('master-franchise')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewRole === 'master-franchise'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Master Franchise
                        </button>
                        <button
                            onClick={() => setViewRole('area-franchise')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewRole === 'area-franchise'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Area Franchise
                        </button>
                    </div>
                </div>
            )}

            <Card
                title={`${viewRole === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'} Partners`}
                subtitle={`Manage ${viewRole === 'master-franchise' ? 'zone-level' : 'area-level'} franchise partners`}
                headerAction={
                    <Button onClick={handleCreateNew}>
                        <UserPlus size={16} className="mr-2" />
                        Add New {viewRole === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'}
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    data={franchiseUsers}
                    loading={usersLoading}
                    emptyMessage={`No ${viewRole === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'} partners found.`}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? `Edit ${role === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'}` : `Create New ${role === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'}`}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Partner Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-6">
                            {!isMasterFranchise && (
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        value="master-franchise"
                                        checked={role === 'master-franchise'}
                                        onChange={(e) => setRole(e.target.value as 'master-franchise')}
                                        className="mr-2 w-4 h-4"
                                    />
                                    <span className="text-sm">Master Franchise (Zone Level)</span>
                                </label>
                            )}
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    value="area-franchise"
                                    checked={role === 'area-franchise'}
                                    onChange={(e) => setRole(e.target.value as 'area-franchise')}
                                    className="mr-2 w-4 h-4"
                                    readOnly={isMasterFranchise}
                                />
                                <span className="text-sm">Area Franchise (Area Level)</span>
                            </label>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                value={fname}
                                onChange={(e) => setFname(e.target.value)}
                                required
                                placeholder="John"
                            />
                            <Input
                                label="Last Name"
                                value={lname}
                                onChange={(e) => setLname(e.target.value)}
                                placeholder="Doe"
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="john@example.com"
                            />
                            <Input
                                label="Mobile Number"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                required
                                placeholder="+91 9876543210"
                            />
                            <div className="md:col-span-2">
                                <Input
                                    label={editingId ? "Password (leave blank to keep unchanged)" : "Password"}
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required={!editingId}
                                    placeholder={editingId ? "Leave blank to keep current password" : "Enter password"}
                                    helperText={editingId ? "Only fill if you want to change the password" : "Minimum 6 characters"}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Zone/Area Assignment */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            {role === 'master-franchise' ? 'Zone Assignment' : 'Area Assignment'}
                        </h3>

                        {role === 'master-franchise' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assign Zone <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={zoneOptions}
                                    value={selectedZone}
                                    onChange={(val) => setSelectedZone(val)}
                                    placeholder="Select a zone to assign"
                                    isSearchable
                                />
                                {selectedZone && (
                                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-900 mb-2">Area: {selectedZone.zone.zoneName}</h4>
                                        <div className="text-sm text-blue-800 space-y-1">
                                            <div>Zone: {selectedZone.zone.zoneName}</div>
                                            <div>City: {selectedZone.zone.cityId}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {role === 'area-franchise' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Zone (Optional Filter)
                                    </label>
                                    <Select
                                        options={zoneOptions}
                                        value={selectedZone}
                                        onChange={(val) => {
                                            setSelectedZone(val);
                                            setSelectedArea(null);
                                        }}
                                        placeholder="Filter areas by zone"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assign Area <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        options={areaOptions}
                                        value={selectedArea}
                                        onChange={(val) => setSelectedArea(val)}
                                        placeholder="Select an area to assign"
                                        isSearchable
                                    />
                                    {selectedArea && (
                                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">Area: {selectedArea.area.areaName}</h4>
                                            <div className="text-sm text-blue-800 space-y-1">
                                                <div>Zone: {selectedArea.area.zoneId.zoneName}</div>
                                                <div>City: {selectedArea.area.zoneId.cityId}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : (editingId ? 'Update Partner' : 'Create Partner')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FranchiseManagement;

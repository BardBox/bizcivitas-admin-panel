import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Table, Button, Modal, Input, Badge, Card, Breadcrumb } from '../../components/shared';
import { getZoneById } from '../../api/zoneApi';
import { getAreasByZone, createArea, updateArea, deleteArea, Area } from '../../api/areaApi';
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas', id] });
            queryClient.invalidateQueries({ queryKey: ['zone', id] });
            toast.success('Area created successfully');
            setIsModalOpen(false);
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
                            <Input
                                label="Area Name"
                                value={areaName}
                                onChange={(e) => setAreaName(e.target.value)}
                                required
                                placeholder="e.g., Downtown"
                                helperText="Name of the area"
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
                                placeholder="e.g., 390001, 390002"
                                helperText="Comma separated pincodes"
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
        </div>
    );
};

export default ZoneDetails;

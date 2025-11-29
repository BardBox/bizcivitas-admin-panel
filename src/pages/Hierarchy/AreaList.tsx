import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Table, Button, Modal, Input, Badge, Card, Breadcrumb } from '../../components/shared';
import { getAllAreas, createArea, updateArea, deleteArea, Area } from '../../api/areaApi';
import { getAllZones, Zone } from '../../api/zoneApi';
import { toast } from 'react-toastify';
import Select from 'react-select';

const AreaList: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [areaName, setAreaName] = useState('');
    const [capacity, setCapacity] = useState(100);
    const [description, setDescription] = useState('');
    const [pincode, setPincode] = useState('');

    // Queries
    const { data: areas = [], isLoading: areasLoading } = useQuery({
        queryKey: ['areas'],
        queryFn: () => getAllAreas(),
    });

    const { data: zones = [] } = useQuery({
        queryKey: ['zones'],
        queryFn: () => getAllZones(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => createArea(data.zoneId, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
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
        setSelectedZone(null);
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
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                                isDisabled={!!editingId} // Disable zone selection when editing
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                {editingId ? "Zone cannot be changed while editing" : "Choose the zone (city) where this area will be located"}
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

                        {/* Area Name & Capacity */}
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

                        {/* Pincode & Description */}
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
                        <Button type="submit" disabled={!selectedZone || !areaName || createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingId ? "Update Area" : "Create Area")}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AreaList;

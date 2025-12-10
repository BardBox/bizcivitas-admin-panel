import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Table, Button, Modal, Input, Badge, Card, Breadcrumb } from '../../components/shared';
import { getAllZones, createZone, updateZone, deleteZone, Zone } from '../../api/zoneApi';
import { toast } from 'react-toastify';
import { Country, State, City } from 'country-state-city';
import Select from 'react-select';

const ZoneList: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const [selectedState, setSelectedState] = useState<any>(null);
    const [selectedCities, setSelectedCities] = useState<any[]>([]); // Changed to array for multi-select
    const [zoneName, setZoneName] = useState(''); // Custom zone name
    const [maxAreas, setMaxAreas] = useState(10);

    // Queries
    const { data: zones = [], isLoading: zonesLoading } = useQuery({
        queryKey: ['zones'],
        queryFn: () => getAllZones(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => createZone(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            toast.success('Zone (City) activated successfully');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to save zone');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateZone(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            toast.success('Zone updated successfully');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update zone');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteZone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            toast.success('Zone deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete zone');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingId && (!selectedCountry || !selectedState || selectedCities.length === 0)) {
            toast.error('Please fill all required fields and select at least one city');
            return;
        }

        if (!editingId && !zoneName.trim()) {
            toast.error('Please enter a zone name');
            return;
        }

        if (editingId) {
            updateMutation.mutate({
                id: editingId,
                payload: { maxAreas }
            });
        } else {
            const citiesArray = selectedCities.map(city => city.name);
            createMutation.mutate({
                countryId: selectedCountry.name,
                stateId: selectedState.name,
                cities: citiesArray, // Send array of city names
                zoneName: zoneName.trim(),
                maxAreas
            });
        }
    };

    const handleEdit = (zone: Zone) => {
        setEditingId(zone._id);
        setMaxAreas(zone.maxAreas || 10);
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
        setSelectedCountry(null);
        setSelectedState(null);
        setSelectedCities([]);
        setZoneName('');
        setMaxAreas(10);
    };

    const columns = [
        { key: 'zoneName', label: 'Zone Name' },
        {
            key: 'cities',
            label: 'Cities',
            render: (zone: Zone) => {
                const cities = zone.cities && zone.cities.length > 0 ? zone.cities : [zone.cityId];
                return (
                    <div className="flex flex-wrap gap-1">
                        {cities.map((city, index) => (
                            <Badge key={index} variant="default" className="text-xs">
                                {city}
                            </Badge>
                        ))}
                    </div>
                );
            }
        },
        { key: 'stateId', label: 'State' },
        { key: 'countryId', label: 'Country' },
        {
            key: 'zonePartner',
            label: 'Zone Partner',
            render: (zone: Zone) => (
                <Badge variant={zone.assignedMFId ? 'success' : 'warning'}>
                    {zone.assignedMFId ? 'ASSIGNED' : 'NOT ASSIGNED'}
                </Badge>
            )
        },
        {
            key: 'areas',
            label: 'Areas',
            render: (zone: Zone) => zone.areas?.length || 0
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (zone: Zone) => (
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => navigate(`/hierarchy/zones/${zone._id}`)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => handleEdit(zone)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(zone._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    // Options for Select
    const countryOptions = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode, ...c }));
    const stateOptions = selectedCountry ? State.getStatesOfCountry(selectedCountry.value).map(s => ({ label: s.name, value: s.isoCode, ...s })) : [];
    const cityOptions = selectedState ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map(c => ({ label: c.name, value: c.name, ...c })) : [];

    return (
        <div className="p-6">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Hierarchy', href: '/hierarchy/zones' },
                    { label: 'Zones' }
                ]}
                className="mb-6"
            />

            <Card
                title="Zone Management"
                subtitle="Activate Cities as Zones"
                headerAction={
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        + Add New Zone (City)
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    data={zones}
                    loading={zonesLoading}
                    onRowClick={(zone) => navigate(`/hierarchy/zones/${zone._id}`)}
                    emptyMessage="No zones found. Add a city to get started."
                />
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Zone" : "Add New Zone (City)"}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingId && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                                    <Select
                                        options={countryOptions}
                                        value={selectedCountry}
                                        onChange={(val) => {
                                            setSelectedCountry(val);
                                            setSelectedState(null);
                                            setSelectedCities([]);
                                        }}
                                        placeholder="Select Country"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                    <Select
                                        options={stateOptions}
                                        value={selectedState}
                                        onChange={(val) => {
                                            setSelectedState(val);
                                            setSelectedCities([]);
                                        }}
                                        placeholder="Select State"
                                        isDisabled={!selectedCountry}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cities * <span className="text-xs text-gray-500">(Select multiple cities for this zone)</span>
                                </label>
                                <Select
                                    isMulti
                                    options={cityOptions}
                                    value={selectedCities}
                                    onChange={(val) => setSelectedCities(val as any[])}
                                    placeholder="Select one or more cities"
                                    isDisabled={!selectedState}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Tip: Group nearby small cities (e.g., Surat, Ankleshwar, Navsari) under one Zone Partner
                                </p>
                            </div>

                            <Input
                                label="Zone Name *"
                                value={zoneName}
                                onChange={(e) => setZoneName(e.target.value)}
                                placeholder="e.g., South Gujarat Zone, Mumbai Metro Zone"
                                required
                                helperText="Give this zone a descriptive name"
                            />
                        </>
                    )}

                    {editingId && (
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-4">
                            Note: You can only update the configuration for this zone. Location details cannot be changed once created.
                        </div>
                    )}

                    <Input
                        type="number"
                        label="Max Areas Allowed"
                        value={maxAreas}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMaxAreas(isNaN(val) ? 0 : val);
                        }}
                        min={1}
                        helperText="Maximum number of areas allowed in this city/zone."
                    />

                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingId ? "Update Zone" : "Activate Zone")}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ZoneList;

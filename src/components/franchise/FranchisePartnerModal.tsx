import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';
import { Modal, Input, Button } from '../shared';
import { createFranchiseUser, updateFranchiseUser, CreateFranchiseData, FranchiseUser } from '../../api/franchiseApi';
import { getAllZones, Zone } from '../../api/zoneApi';
import { getAllAreas, Area } from '../../api/areaApi';
import { toast } from 'react-toastify';

interface FranchisePartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser?: FranchiseUser | null;
    prefilledRole?: 'master-franchise' | 'area-franchise';
    prefilledZoneId?: string;
    onSuccess?: () => void;
}

const FranchisePartnerModal: React.FC<FranchisePartnerModalProps> = ({
    isOpen,
    onClose,
    editingUser,
    prefilledRole,
    prefilledZoneId,
    onSuccess
}) => {
    const queryClient = useQueryClient();

    // Form State
    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'master-franchise' | 'area-franchise'>(prefilledRole || 'master-franchise');
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [selectedArea, setSelectedArea] = useState<any>(null);

    // Queries
    const { data: zones = [] } = useQuery({
        queryKey: ['zones'],
        queryFn: () => getAllZones(),
    });

    const { data: areas = [] } = useQuery({
        queryKey: ['areas', selectedZone?.value],
        queryFn: () => {
            if (!selectedZone?.value) return [];
            return getAllAreas();
        },
        enabled: !!selectedZone?.value && role === 'area-franchise',
    });

    // Get all assigned area IDs from existing area franchise users
    const { data: franchiseUsers = [] } = useQuery({
        queryKey: ['franchise-users'],
        queryFn: async () => {
            // This would need to be implemented in your API
            return [];
        },
    });

    const assignedAreaIds = new Set(
        franchiseUsers
            .filter((user: FranchiseUser) => user.role === 'area-franchise' && user.areaId)
            .map((user: FranchiseUser) => {
                return typeof user.areaId === 'object' ? user.areaId._id : user.areaId;
            })
    );

    const editingAreaId = editingUser && role === 'area-franchise' && selectedArea?.value ? selectedArea.value : null;

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateFranchiseData) => createFranchiseUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['franchise-users'] });
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            queryClient.invalidateQueries({ queryKey: ['area-franchises-available'] });
            toast.success('Franchise partner created successfully');
            resetForm();
            onClose();
            if (onSuccess) onSuccess();
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
            resetForm();
            onClose();
            if (onSuccess) onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update franchise partner');
        }
    });

    // Pre-fill zone if provided
    useEffect(() => {
        if (prefilledZoneId && zones.length > 0 && !selectedZone) {
            const zone = zones.find((z: Zone) => z._id === prefilledZoneId);
            if (zone) {
                setSelectedZone({
                    label: `${zone.zoneName} (${zone.cities?.join(', ') || zone.cityId})`,
                    value: zone._id,
                    zone: zone
                });
            }
        }
    }, [prefilledZoneId, zones, selectedZone]);

    // Pre-fill form when editing
    useEffect(() => {
        if (editingUser) {
            setFname(editingUser.fname);
            setLname(editingUser.lname || '');
            setEmail(editingUser.email);
            setMobile(editingUser.mobile);
            setPassword('');
            setRole(editingUser.role as 'master-franchise' | 'area-franchise');

            if (editingUser.role === 'master-franchise' && editingUser.zoneId) {
                if (typeof editingUser.zoneId === 'object' && editingUser.zoneId._id) {
                    setSelectedZone({
                        label: `${editingUser.zoneId.zoneName} (${(editingUser.zoneId as any).cities?.join(', ') || editingUser.zoneId.cityId})`,
                        value: editingUser.zoneId._id,
                        zone: editingUser.zoneId
                    });
                } else {
                    const zone = zones.find((z: Zone) => z._id === editingUser.zoneId);
                    if (zone) {
                        setSelectedZone({
                            label: `${zone.zoneName} (${zone.cities?.join(', ') || zone.cityId})`,
                            value: zone._id,
                            zone: zone
                        });
                    }
                }
            } else if (editingUser.role === 'area-franchise' && editingUser.areaId) {
                if (typeof editingUser.areaId === 'object' && editingUser.areaId._id) {
                    setSelectedArea({
                        label: `${editingUser.areaId.areaName} (${typeof editingUser.areaId.zoneId === 'object' ? editingUser.areaId.zoneId.zoneName : 'Unknown Zone'})`,
                        value: editingUser.areaId._id,
                        area: editingUser.areaId
                    });
                }
            }
        }
    }, [editingUser, zones]);

    const resetForm = () => {
        setFname('');
        setLname('');
        setEmail('');
        setMobile('');
        setPassword('');
        setRole(prefilledRole || 'master-franchise');
        if (!prefilledZoneId) {
            setSelectedZone(null);
        }
        setSelectedArea(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fname || !email || !mobile || !role) {
            toast.error('Please fill all required fields');
            return;
        }

        if (!editingUser && !password) {
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

        if (password) {
            payload.password = password;
        }

        if (role === 'master-franchise' && selectedZone) {
            payload.zoneId = selectedZone.value;
            payload.country = selectedZone.zone.countryId;
            payload.state = selectedZone.zone.stateId;
            payload.city = selectedZone.zone.cities?.[0] || selectedZone.zone.cityId;
        }

        if (role === 'area-franchise' && selectedArea) {
            payload.areaId = selectedArea.value;
            payload.zoneId = typeof selectedArea.area.zoneId === 'object' ? selectedArea.area.zoneId._id : selectedArea.area.zoneId;
            payload.country = selectedArea.area.zoneId.countryId;
            payload.state = selectedArea.area.zoneId.stateId;
            payload.city = selectedArea.area.zoneId.cities?.[0] || selectedArea.area.zoneId.cityId;
        }

        if (editingUser) {
            updateMutation.mutate({ id: editingUser._id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const zoneOptions = zones.map((zone: Zone) => ({
        label: `${zone.zoneName} (${zone.cities?.join(', ') || zone.cityId})`,
        value: zone._id,
        zone: zone
    }));

    const areaOptions = selectedZone
        ? areas
            .filter((area: Area) => {
                const zoneId = typeof area.zoneId === 'object' ? area.zoneId._id : area.zoneId;
                const matchesZone = zoneId === selectedZone.value;
                const isAvailable = !assignedAreaIds.has(area._id) || area._id === editingAreaId;
                return matchesZone && isAvailable;
            })
            .map((area: Area) => ({
                label: `${area.areaName} (${typeof area.zoneId === 'object' ? area.zoneId.zoneName : 'Unknown Zone'})`,
                value: area._id,
                area: area
            }))
        : [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                resetForm();
                onClose();
            }}
            title={editingUser ? `Edit ${role === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'}` : `Create New ${role === 'master-franchise' ? 'Master Franchise' : 'Area Franchise'}`}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Partner Type */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Partner Type *</h4>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                checked={role === 'master-franchise'}
                                onChange={() => setRole('master-franchise')}
                                className="mr-2 w-4 h-4"
                                disabled={!!prefilledRole}
                            />
                            <span className="text-sm font-medium">Master Franchise (Zone Level)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                checked={role === 'area-franchise'}
                                onChange={() => setRole('area-franchise')}
                                className="mr-2 w-4 h-4"
                                disabled={!!prefilledRole}
                            />
                            <span className="text-sm font-medium">Area Franchise (Area Level)</span>
                        </label>
                    </div>
                </div>

                {/* Personal Information */}
                <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="email"
                        label="Email"
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
                </div>

                <Input
                    type="password"
                    label={editingUser ? "Password (leave blank to keep unchanged)" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingUser}
                    placeholder={editingUser ? "Leave blank to keep current password" : "••••••••"}
                    helperText={editingUser ? "Only fill if you want to change the password" : "Minimum 6 characters"}
                />

                {/* Zone/Area Assignment */}
                <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                        {role === 'master-franchise' ? 'Zone Assignment' : 'Area Assignment'}
                    </h4>

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
                                isDisabled={!!prefilledZoneId}
                            />
                            {selectedZone && (
                                <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-purple-900 mb-2">Zone: {selectedZone.zone.zoneName}</h4>
                                    <div className="text-sm text-purple-800">
                                        <div>Cities: {selectedZone.zone.cities?.join(', ') || selectedZone.zone.cityId}</div>
                                        <div>State: {selectedZone.zone.stateId}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {role === 'area-franchise' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Zone {prefilledZoneId ? '' : '(Optional Filter)'}
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
                                    isClearable={!prefilledZoneId}
                                    isDisabled={!!prefilledZoneId}
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
                                    isDisabled={!selectedZone}
                                />
                                {selectedArea && (
                                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-purple-900 mb-2">Area: {selectedArea.area.areaName}</h4>
                                        <div className="text-sm text-purple-800">
                                            <div>Zone: {selectedArea.area.zoneId.zoneName}</div>
                                            <div>City: {selectedArea.area.zoneId.cities?.join(', ') || selectedArea.area.zoneId.cityId}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {createMutation.isPending || updateMutation.isPending
                            ? (editingUser ? 'Updating...' : 'Creating...')
                            : (editingUser ? 'Update Partner' : 'Create Partner')
                        }
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default FranchisePartnerModal;

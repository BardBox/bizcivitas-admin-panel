import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';

import { getAllZones, Zone } from '../../api/zoneApi';
import { getAreasDropdown } from '../../api/areaApi';
import api from '../../api/api';
import { Card, Button, Input, Breadcrumb } from '../../components/shared';

// =====================================
// TYPES
// =====================================

type AdminRole = 'master-franchise' | 'area-franchise' | 'cgc' | 'dcp';

interface FranchiseFormData {
    fname: string;
    lname: string;
    email: string;
    mobile: string;
    role: AdminRole;
    zoneId?: string; // For MF, AF, CGC, DCP
    areaId?: string; // For AF, CGC
    password: string; // Required for creation
}

// =====================================
// VALIDATION SCHEMA
// =====================================

const schema = yup.object().shape({
    fname: yup.string().required('First name is required'),
    lname: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    mobile: yup.string().matches(/^[0-9]{10}$/, 'Invalid mobile number').required('Mobile is required'),
    role: yup.string().required('Role is required'),
    zoneId: yup.string().when('role', {
        is: (role: string) => ['master-franchise', 'area-franchise', 'cgc', 'dcp'].includes(role),
        then: (schema) => schema.required('Zone is required'),
        otherwise: (schema) => schema.optional(),
    }),
    areaId: yup.string().when('role', {
        is: (role: string) => ['area-franchise', 'cgc'].includes(role),
        then: (schema) => schema.required('Area is required'),
        otherwise: (schema) => schema.optional(),
    }),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const CreateFranchise: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [selectedArea, setSelectedArea] = useState<any>(null);

    // =====================================
    // FORM SETUP
    // =====================================

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FranchiseFormData>({
        resolver: yupResolver(schema) as any, // Cast to any to bypass strict type check if needed, or fix schema type
        defaultValues: {
            fname: '',
            lname: '',
            email: '',
            mobile: '',
            role: 'master-franchise',
            password: '',
        },
    });

    const selectedRole = watch('role');

    // =====================================
    // QUERIES
    // =====================================

    const { data: zones = [] } = useQuery({
        queryKey: ['zones'],
        queryFn: () => getAllZones(),
    });

    const { data: areas = [] } = useQuery({
        queryKey: ['areas', selectedZone?.value],
        queryFn: () => getAreasDropdown(selectedZone?.value),
        enabled: !!selectedZone?.value && ['area-franchise', 'cgc'].includes(selectedRole),
    });

    // =====================================
    // MUTATION
    // =====================================

    const createMutation = useMutation({
        mutationFn: async (data: FranchiseFormData) => {
            // Find selected zone to get location details (optional, but good to pass if backend needs it)
            const selectedZoneObj = zones.find((z: Zone) => z._id === data.zoneId);

            // PROPOSED BACKEND PAYLOAD
            // This assumes the backend will implement /users/create-admin to handle
            // validation, user creation, and hierarchy assignment in one go.
            const userPayload = {
                fname: data.fname,
                lname: data.lname,
                email: data.email,
                mobile: data.mobile,
                role: data.role,
                password: data.password,
                // Hierarchy IDs
                zoneId: data.zoneId,
                areaId: data.areaId,
                // Location details (optional)
                city: selectedZoneObj?.cityId,
                state: selectedZoneObj?.stateId,
                country: selectedZoneObj?.countryId,
            };

            console.log('Sending payload to /users/create-admin:', userPayload);

            // NOTE: This endpoint '/users/create-admin' needs to be implemented on the backend.
            // currently it will likely return 404.
            const userResponse = await api.post('/users/create-admin', userPayload);

            return userResponse.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Franchise/Admin created successfully');
            navigate('/user');
        },
        onError: (error: any) => {
            console.error('Create Mutation Failed:', error);
            const msg = error.response?.status === 404
                ? 'Backend endpoint /users/create-admin not found. Please implement it.'
                : (error.response?.data?.message || 'Failed to create user');
            toast.error(msg);
        },
    });

    const onSubmit = (data: FranchiseFormData) => {
        createMutation.mutate(data);
    };

    // =====================================
    // OPTIONS
    // =====================================

    const roleOptions = [
        { label: 'Master Franchise (City Head)', value: 'master-franchise' },
        { label: 'Area Franchise (Area Head)', value: 'area-franchise' },
        { label: 'Digital Channel Partner (DCP)', value: 'dcp' },
        { label: 'Core Group Council (CGC)', value: 'cgc' },
    ];

    const zoneOptions = zones.map((z: Zone) => ({
        label: `${z.zoneName} (${z.cityId})`,
        value: z._id,
    }));

    const areaOptions = areas.map((a: any) => ({
        label: a.areaName,
        value: a._id,
    }));

    return (
        <div className="p-6">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Users', href: '/user' },
                    { label: 'Create Franchise' },
                ]}
                className="mb-6"
            />

            <Card title="Create Franchise / Admin User" subtitle="Assign roles and hierarchy">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={roleOptions}
                                    value={roleOptions.find((r) => r.value === field.value)}
                                    onChange={(val) => {
                                        field.onChange(val?.value);
                                        setSelectedZone(null);
                                        setSelectedArea(null);
                                        setValue('zoneId', '');
                                        setValue('areaId', '');
                                    }}
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="First Name"
                            {...control.register('fname')}
                            error={errors.fname?.message}
                        />
                        <Input
                            label="Last Name"
                            {...control.register('lname')}
                            error={errors.lname?.message}
                        />
                        <Input
                            label="Email"
                            type="email"
                            {...control.register('email')}
                            error={errors.email?.message}
                        />
                        <Input
                            label="Mobile"
                            {...control.register('mobile')}
                            error={errors.mobile?.message}
                        />
                        <Input
                            label="Password"
                            type="password"
                            {...control.register('password')}
                            error={errors.password?.message}
                        />
                    </div>

                    {/* Hierarchy Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Hierarchy Assignment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Zone Selection (Required for all these roles) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Zone (City) <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    name="zoneId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            options={zoneOptions}
                                            value={selectedZone}
                                            onChange={(val) => {
                                                field.onChange(val?.value);
                                                setSelectedZone(val);
                                                setSelectedArea(null);
                                                setValue('areaId', '');
                                            }}
                                            placeholder="Select Zone"
                                        />
                                    )}
                                />
                                {errors.zoneId && <p className="text-red-500 text-sm mt-1">{errors.zoneId.message}</p>}
                            </div>

                            {/* Area Selection (Required for AF, CGC) */}
                            {['area-franchise', 'cgc'].includes(selectedRole) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Area <span className="text-red-500">*</span>
                                    </label>
                                    <Controller
                                        name="areaId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                options={areaOptions}
                                                value={selectedArea}
                                                onChange={(val) => {
                                                    field.onChange(val?.value);
                                                    setSelectedArea(val);
                                                }}
                                                placeholder="Select Area"
                                                isDisabled={!selectedZone}
                                            />
                                        )}
                                    />
                                    {errors.areaId && <p className="text-red-500 text-sm mt-1">{errors.areaId.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button variant="secondary" onClick={() => navigate('/user')} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateFranchise;

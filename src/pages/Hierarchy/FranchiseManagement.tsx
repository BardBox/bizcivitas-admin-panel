import React, { useState } from 'react';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Table, Button, Badge, Card, Breadcrumb } from '../../components/shared';
import { getUsersByRole, deleteFranchiseUser, FranchiseUser } from '../../api/franchiseApi';
import { toast } from 'react-toastify';
import { getUserFromLocalStorage } from '../../api/auth';
import FranchisePartnerModal from '../../components/franchise/FranchisePartnerModal';

const FranchiseManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const user = getUserFromLocalStorage();
    const isMasterFranchise = user?.role === 'master-franchise';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<FranchiseUser | null>(null);
    const [viewRole, setViewRole] = useState<'master-franchise' | 'area-franchise'>(
        isMasterFranchise ? 'area-franchise' : 'master-franchise'
    );

    // Queries
    const { data: franchiseUsers = [], isLoading: usersLoading } = useQuery({
        queryKey: ['franchise-users', viewRole],
        queryFn: () => getUsersByRole(viewRole),
    });

    // Mutations
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

    const handleCreateNew = () => {
        setEditingUser(null);
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

    const handleEdit = (user: FranchiseUser) => {
        setEditingUser(user);
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
            <FranchisePartnerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setEditingUser(null);
                    setIsModalOpen(false);
                }}
                editingUser={editingUser}
                prefilledRole={isMasterFranchise ? 'area-franchise' : undefined}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['franchise-users'] });
                }}
            />
        </div>
    );
};

export default FranchiseManagement;

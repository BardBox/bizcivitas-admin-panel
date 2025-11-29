import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, Breadcrumb } from '../../components/shared';
import { getAllRoles, getRoleInfo, UserRole, roleHierarchy } from '../../api/rbacApi';

interface RoleDisplayData {
    role: UserRole;
    name: string;
    shortName: string;
    description: string;
    hierarchyLevel: number;
    // Add _id or id to satisfy TableProps constraint if strictly required, or cast
    _id?: string;
}

const RoleManagement: React.FC = () => {
    const [roles, setRoles] = useState<RoleDisplayData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = () => {
        try {
            setLoading(true);
            const allRoles = getAllRoles();
            const roleData: RoleDisplayData[] = allRoles.map((role, index) => ({
                role,
                ...getRoleInfo(role),
                hierarchyLevel: roleHierarchy[role],
                _id: `role-${index}` // Mock ID for Table key
            }));

            // Sort by hierarchy level (highest first)
            roleData.sort((a, b) => b.hierarchyLevel - a.hierarchyLevel);
            setRoles(roleData);
        } catch (error) {
            console.error('Error loading roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const getHierarchyBadge = (level: number) => {
        if (level >= 7) return <Badge variant="danger">Level {level}</Badge>;
        if (level >= 5) return <Badge variant="warning">Level {level}</Badge>;
        if (level >= 3) return <Badge variant="info">Level {level}</Badge>;
        return <Badge variant="default">Level {level}</Badge>;
    };

    const columns = [
        {
            key: 'hierarchyLevel',
            label: 'Level',
            render: (roleData: RoleDisplayData) => getHierarchyBadge(roleData.hierarchyLevel)
        },
        {
            key: 'shortName',
            label: 'Short Name',
            render: (roleData: RoleDisplayData) => (
                <Badge variant="success" className="font-mono">{roleData.shortName}</Badge>
            )
        },
        {
            key: 'name',
            label: 'Role Name',
            render: (roleData: RoleDisplayData) => (
                <span className="font-medium">{roleData.name}</span>
            )
        },
        {
            key: 'role',
            label: 'System Value',
            render: (roleData: RoleDisplayData) => (
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{roleData.role}</code>
            )
        },
        {
            key: 'description',
            label: 'Description',
            render: (roleData: RoleDisplayData) => (
                <span className="text-sm text-gray-600">{roleData.description}</span>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Settings', href: '/settings' },
                    { label: 'Role Management' }
                ]}
            />

            <Card
                title="System Roles"
                subtitle="Static role hierarchy and definitions (roles cannot be created or modified)"
            >
                <Table<RoleDisplayData>
                    columns={columns}
                    data={roles}
                    loading={loading}
                    emptyMessage="No roles found"
                />
            </Card>

            {/* Role Hierarchy Explanation Card */}
            <Card
                title="Role Hierarchy Explained"
                subtitle="Understanding the BizCivitas organizational structure"
            >
                <div className="space-y-6">
                    {/* Hierarchy Diagram */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-4">Hierarchy Flow (Top to Bottom)</h4>
                        <div className="space-y-2 font-mono text-sm">
                            <div className="flex items-center space-x-3">
                                <Badge variant="danger">8</Badge>
                                <span>Admin (SA)</span>
                                <span className="text-gray-500">→ Platform Administrator</span>
                            </div>
                            <div className="flex items-center space-x-3 pl-6">
                                <Badge variant="danger">7</Badge>
                                <span>Master Franchise (MF)</span>
                                <span className="text-gray-500">→ Manages Zone (City)</span>
                            </div>
                            <div className="flex items-center space-x-3 pl-12">
                                <Badge variant="warning">6</Badge>
                                <span>Area Franchise (AF)</span>
                                <span className="text-gray-500">→ Manages Area within Zone</span>
                            </div>
                            <div className="flex items-center space-x-3 pl-18">
                                <Badge variant="warning">5</Badge>
                                <span>Core Group Council (CGC)</span>
                                <span className="text-gray-500">→ 3+ Leaders of Core Group</span>
                            </div>
                            <div className="flex items-center space-x-3 pl-24">
                                <Badge variant="info">4</Badge>
                                <span>Digital Chapter Partner (DCP)</span>
                                <span className="text-gray-500">→ Manages Digital Members</span>
                            </div>
                            <div className="flex items-center space-x-3 pl-18">
                                <Badge variant="info">3</Badge>
                                <span>Pioneer</span>
                                <span className="text-gray-500">→ Early Adopter Recognition</span>
                            </div>
                            <div className="flex items-center space-x-3 pl-12">
                                <Badge variant="default">2</Badge>
                                <span>Core Member</span>
                                <span className="text-gray-500">→ Flagship Member</span>
                            </div>
                            <div className="flex items-center space-x-3 pl-6">
                                <Badge variant="default">1</Badge>
                                <span>Digital Member (DM)</span>
                                <span className="text-gray-500">→ Digital-Only Participant</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Badge variant="default">0</Badge>
                                <span>User</span>
                                <span className="text-gray-500">→ Default Registered User</span>
                            </div>
                        </div>
                    </div>

                    {/* Commission Earning Roles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h5 className="font-semibold text-blue-900 mb-3">Flagship Commission Earners (12% Pool)</h5>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">SA</Badge>
                                    <span>12% of pool</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">MF</Badge>
                                    <span>12% of pool</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">AF</Badge>
                                    <span>7% of pool</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">Core</Badge>
                                    <span>4% of pool</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-green-900 mb-3">Digital Commission Earners (40% Pool)</h5>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">SA</Badge>
                                    <span>40% of pool</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">MF</Badge>
                                    <span>40% of pool</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">AF</Badge>
                                    <span>30% of pool</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Badge variant="success" size="sm">DCP</Badge>
                                    <span>20% of pool</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Geographic Hierarchy */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-3">Geographic Hierarchy</h5>
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">Country</span>
                            <span>→</span>
                            <span className="font-medium">State</span>
                            <span>→</span>
                            <span className="font-medium text-red-600">Zone (City)</span>
                            <span className="text-xs text-gray-600">[Managed by MF]</span>
                            <span>→</span>
                            <span className="font-medium text-orange-600">Area</span>
                            <span className="text-xs text-gray-600">[Managed by AF]</span>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Note:</strong> Roles are hardcoded in the backend and cannot be created, modified, or deleted through the admin panel.
                                    To assign roles to users, go to User Management.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RoleManagement;

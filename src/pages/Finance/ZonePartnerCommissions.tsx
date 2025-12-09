import React, { useEffect, useState } from 'react';
import { getAllCommissions, Commission } from '../../api/commissionApi';
import { toast } from 'react-toastify';
import {
    FiDollarSign,
    FiUsers,
    FiClock,
    FiCheckCircle,
    FiFilter,
    FiDownload,
    FiUser
} from 'react-icons/fi';
import { Card, Button } from '../../components/shared';

const ZonePartnerCommissions: React.FC = () => {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCommissions: 0,
        totalAmount: 0,
        pending: 0,
        completed: 0,
        myTotalEarnings: 0,
        myPendingEarnings: 0,
        myPaidEarnings: 0
    });

    // Filters
    const [membershipFilter, setMembershipFilter] = useState<'all' | 'flagship' | 'digital'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partially_paid' | 'completed'>('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [membershipFilter, statusFilter, dateRange]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch commissions
            const params: any = {};
            if (membershipFilter !== 'all') params.membershipType = membershipFilter;
            if (statusFilter !== 'all') params.overallStatus = statusFilter;
            if (dateRange.start) params.startDate = dateRange.start;
            if (dateRange.end) params.endDate = dateRange.end;

            const commissionsResponse = await getAllCommissions(params);
            const commissionsData = commissionsResponse?.data?.data || commissionsResponse?.data || commissionsResponse;

            setCommissions(commissionsData.commissions || []);

            // Calculate stats
            const commissionsList = commissionsData.commissions || [];
            let myTotal = 0;
            let myPending = 0;
            let myPaid = 0;

            commissionsList.forEach((commission: Commission) => {
                const mfAmount = commission.distribution.mf.amount;
                myTotal += mfAmount;

                if (commission.distribution.mf.status === 'done') {
                    myPaid += mfAmount;
                } else {
                    myPending += mfAmount;
                }
            });

            setStats({
                totalCommissions: commissionsData.summary?.totalCommissions || commissionsList.length,
                totalAmount: commissionsData.summary?.totalAmount || 0,
                pending: commissionsData.summary?.pending || 0,
                completed: commissionsData.summary?.completed || 0,
                myTotalEarnings: myTotal,
                myPendingEarnings: myPending,
                myPaidEarnings: myPaid
            });

            // Note: User summary endpoint removed as all needed statistics 
            // are already calculated above from commission data
        } catch (error) {
            console.error('Failed to fetch commissions:', error);
            toast.error('Failed to load commission data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-orange-100 text-orange-700 border-orange-200',
            partially_paid: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-green-100 text-green-700 border-green-200',
            done: 'bg-green-100 text-green-700 border-green-200'
        };

        const icons = {
            pending: <FiClock className="w-3 h-3" />,
            partially_paid: <FiDollarSign className="w-3 h-3" />,
            completed: <FiCheckCircle className="w-3 h-3" />,
            done: <FiCheckCircle className="w-3 h-3" />
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${styles[status as keyof typeof styles]}`}>
                {icons[status as keyof typeof icons]}
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const exportToCSV = () => {
        const headers = ['Date', 'User Name', 'User Email', 'Membership Type', 'Base Amount', 'My Commission', 'Status', 'Payment Status'];
        const rows = filteredCommissions.map(commission => [
            formatDate(commission.calculatedAt),
            commission.sourceMember.name,
            commission.sourceMember.email,
            commission.membershipType.toUpperCase(),
            commission.baseAmount,
            commission.distribution.mf.amount,
            commission.overallStatus,
            commission.distribution.mf.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zone-commissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Filter commissions by search term
    const filteredCommissions = commissions.filter(commission => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            commission.sourceMember.name.toLowerCase().includes(search) ||
            commission.sourceMember.email.toLowerCase().includes(search)
        );
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Zone Commissions</h1>
                <p className="text-gray-600">
                    Track commissions earned from members in your zone
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Members</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalCommissions}</p>
                            <p className="text-xs text-blue-100 mt-1">Generated commissions</p>
                        </div>
                        <FiUsers className="w-10 h-10 text-blue-200" />
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Earnings</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.myTotalEarnings)}</p>
                            <p className="text-xs text-green-100 mt-1">All time</p>
                        </div>
                        <FiDollarSign className="w-10 h-10 text-green-200" />
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Pending</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.myPendingEarnings)}</p>
                            <p className="text-xs text-orange-100 mt-1">{stats.pending} transactions</p>
                        </div>
                        <FiClock className="w-10 h-10 text-orange-200" />
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Received</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.myPaidEarnings)}</p>
                            <p className="text-xs text-purple-100 mt-1">{stats.completed} completed</p>
                        </div>
                        <FiCheckCircle className="w-10 h-10 text-purple-200" />
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <FiFilter className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Name or email..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                        <select
                            value={membershipFilter}
                            onChange={(e) => setMembershipFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Types</option>
                            <option value="flagship">Flagship</option>
                            <option value="digital">Digital</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setMembershipFilter('all');
                            setStatusFilter('all');
                            setDateRange({ start: '', end: '' });
                            setSearchTerm('');
                        }}
                    >
                        Clear Filters
                    </Button>
                    <Button variant="primary" className="flex items-center gap-2" onClick={exportToCSV}>
                        <FiDownload className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </Card>

            {/* Commission Table */}
            <Card>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Commission Details by User</h3>
                    <p className="text-sm text-gray-600">View all members who generated commissions for your zone</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Member Details
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Membership
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Payment Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Commission Pool
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    My Commission
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Payment Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Overall Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            <span className="ml-3 text-gray-600">Loading commissions...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCommissions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        No commissions found
                                    </td>
                                </tr>
                            ) : (
                                filteredCommissions.map((commission) => (
                                    <tr key={commission._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <FiUser className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {commission.sourceMember.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{commission.sourceMember.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${commission.membershipType === 'flagship'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-cyan-100 text-cyan-700'
                                                }`}>
                                                {commission.membershipType.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                            {formatCurrency(commission.baseAmount)}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-semibold text-green-600">
                                            {formatCurrency(commission.totalCommissionPool)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm">
                                                <p className="font-bold text-indigo-600">
                                                    {formatCurrency(commission.distribution.mf.amount)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {commission.distribution.mf.percentage}% of pool
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(commission.distribution.mf.status)}
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(commission.overallStatus)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {formatDate(commission.calculatedAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Info */}
                {filteredCommissions.length > 0 && (
                    <div className="mt-4 px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-semibold">{filteredCommissions.length}</span> commission{filteredCommissions.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-gray-600">
                            Total Earnings: <span className="font-bold text-indigo-600">{formatCurrency(stats.myTotalEarnings)}</span>
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ZonePartnerCommissions;

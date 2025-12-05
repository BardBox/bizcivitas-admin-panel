import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    TextField,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip,
    CircularProgress,
    Grid,
    InputAdornment,
} from "@mui/material";
import { Download, Search, TrendingUp, Users, Calendar } from "lucide-react";
import api from "../../api/api";
import { toast } from "react-toastify";

interface InvitedUserRecord {
    visitorName: string;
    email: string;
    businessCategory: string;
    businessSubcategory: string;
    mobile: string;
    amount: number;
    status: string;
    createdAt: string;
    meetingTitle: string;
    meetingDate: string;
}

type DateFilterType = "15days" | "3months" | "6months" | "tilldate";

interface InviteAnalyticsProps {
    filterLevel?: "platform" | "country" | "state" | "zone" | "area";
    selectedZone?: { _id: string; zoneName: string } | null;
    selectedArea?: { _id: string; areaName: string } | null;
}

export default function InviteAnalytics({
    filterLevel = "platform",
    selectedZone = null,
    selectedArea = null,
}: InviteAnalyticsProps = {}) {
    const [records, setRecords] = useState<InvitedUserRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<InvitedUserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilterType>("tilldate");

    // Statistics
    const [stats, setStats] = useState({
        totalInvited: 0,
        last15DaysCount: 0,
        totalPaidAmount: 0,
    });

    useEffect(() => {
        fetchAllRecords();
    }, [filterLevel, selectedZone, selectedArea]); // Re-fetch when filters change

    useEffect(() => {
        applyFilters();
    }, [records, searchQuery, dateFilter]);

    const fetchAllRecords = async () => {
        setLoading(true);
        try {
            const { startDate, endDate } = getDateRange(dateFilter);

            const payload: any = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };

            // Add hierarchical filters
            if (filterLevel === "area" && selectedArea) {
                payload.areaId = selectedArea._id;
            } else if (filterLevel === "zone" && selectedZone) {
                payload.zoneId = selectedZone._id;
            }

            console.log("Fetching Invite records with payload:", payload);

            const response = await api.post("/meetings/detailed-by-date", payload);

            if (response.data.success) {
                const data = response.data.data.invitedUsers || [];
                setRecords(data);

                // Calculate stats from actual data
                const fifteenDaysAgo = new Date();
                fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

                const last15DaysCount = data.filter((r: InvitedUserRecord) =>
                    new Date(r.createdAt) >= fifteenDaysAgo
                ).length;

                const totalPaidAmount = data.reduce((sum: number, r: InvitedUserRecord) => sum + (r.amount || 0), 0);

                setStats({
                    totalInvited: data.length,
                    last15DaysCount: last15DaysCount,
                    totalPaidAmount: totalPaidAmount,
                });
            }
        } catch (error: any) {
            console.error("Error fetching invited user records:", error);
            toast.error(error.response?.data?.message || "Failed to load invited user records");
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = (filter: DateFilterType) => {
        const endDate = new Date();
        const startDate = new Date();

        switch (filter) {
            case "15days":
                startDate.setDate(endDate.getDate() - 15);
                break;
            case "3months":
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case "6months":
                startDate.setMonth(endDate.getMonth() - 6);
                break;
            case "tilldate":
                startDate.setFullYear(2020, 0, 1); // Start from 2020
                break;
        }

        return { startDate, endDate };
    };

    const applyFilters = () => {
        let filtered = [...records];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((record) =>
                record.visitorName.toLowerCase().includes(query) ||
                record.email.toLowerCase().includes(query) ||
                record.mobile.toLowerCase().includes(query) ||
                record.meetingTitle.toLowerCase().includes(query) ||
                record.businessCategory.toLowerCase().includes(query)
            );
        }

        setFilteredRecords(filtered);
    };

    const exportToCSV = () => {
        const headers = [
            "Date Invited",
            "Visitor Name",
            "Email",
            "Mobile",
            "Business Category",
            "Subcategory",
            "Meeting Title",
            "Meeting Date",
            "Status",
            "Amount",
        ];

        const rows = filteredRecords.map((record) => [
            new Date(record.createdAt).toLocaleDateString(),
            record.visitorName,
            record.email,
            record.mobile,
            record.businessCategory,
            record.businessSubcategory,
            record.meetingTitle,
            record.meetingDate ? new Date(record.meetingDate).toLocaleDateString() : "N/A",
            record.status,
            record.amount,
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invite_analytics_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
                    Invite Analytics
                </Typography>
                <Typography variant="body1" sx={{ color: "#64748b" }}>
                    Track visitor invitations and paid meetings
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: "#eff6ff", border: "2px solid #3b82f6" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Users size={40} color="#3b82f6" />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#3b82f6" }}>
                                        {stats.totalInvited}
                                    </Typography>
                                    <Typography sx={{ color: "#64748b" }}>Total Invited Visitors</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: "#f0fdf4", border: "2px solid #10b981" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <TrendingUp size={40} color="#10b981" />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#10b981" }}>
                                        {stats.last15DaysCount}
                                    </Typography>
                                    <Typography sx={{ color: "#64748b" }}>Last 15 Days</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: "#fef3c7", border: "2px solid #f59e0b" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Calendar size={40} color="#f59e0b" />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                                        {formatCurrency(stats.totalPaidAmount)}
                                    </Typography>
                                    <Typography sx={{ color: "#64748b" }}>Total Paid Amount</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters and Actions */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search by name, email, meeting..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search size={20} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Date Range"
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value as DateFilterType);
                                    fetchAllRecords();
                                }}
                            >
                                <MenuItem value="15days">Last 15 Days</MenuItem>
                                <MenuItem value="3months">Last 3 Months</MenuItem>
                                <MenuItem value="6months">Last 6 Months</MenuItem>
                                <MenuItem value="tilldate">All Time</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} md={5} sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                            <Button
                                variant="contained"
                                startIcon={<Download size={18} />}
                                onClick={exportToCSV}
                                sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
                            >
                                Export CSV
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f8fafc" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Date Invited</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Visitor Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Business Category</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Meeting Details</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Typography color="textSecondary">No invited visitors found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {record.visitorName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{record.email}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {record.mobile}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{record.businessCategory}</Typography>
                                            {record.businessSubcategory && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {record.businessSubcategory}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {record.meetingTitle}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {record.meetingDate ? new Date(record.meetingDate).toLocaleDateString() : "N/A"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={record.status}
                                                size="small"
                                                color={record.status === "confirmed" ? "success" : "warning"}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {record.amount > 0 ? (
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#10b981" }}>
                                                    {formatCurrency(record.amount)}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="textSecondary">
                                                    Free
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
}

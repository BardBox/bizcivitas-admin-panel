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
import {
  Download,
  Search,
  TrendingUp,
  Users,
  Calendar,
  Phone,
} from "lucide-react";
import api from "../../api/api";
import { toast } from "react-toastify";
import StatusBreakdownChart from "./StatusBreakdownChart";

interface InviteSlip {
  _id: string;
  from: {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    mobile?: number;
    membershipType?: string;
    companyName?: string;
    city?: string;
  };
  to: {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    mobile?: number;
    membershipType?: string;
    companyName?: string;
    city?: string;
  };
  referral: string; // Name of the person being invited (backend field name)
  telephone: string;
  email?: string;
  address?: string;
  comments?: string;
  contactRelation?: string;
  status?: string; // Meeting status: "Contacted" | "Not Contacted Yet" | "No Response" | "Got the business"
  createdAt: string;
  updatedAt: string;
}

type DateFilterType = "15days" | "30days" | "90days" | "tilldate";

interface ReferralAnalyticsProps {
  businessArea?: string; // The business area name (e.g., "Jawahar Nagar")
}

export default function ReferralAnalytics({ businessArea }: ReferralAnalyticsProps) {
  const [records, setRecords] = useState<InviteSlip[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InviteSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("tilldate");

  // Statistics
  const [stats, setStats] = useState({
    totalInvites: 0,
    last15DaysCount: 0,
    last30DaysCount: 0,
    allTimeCount: 0,
  });

  // Top inviters
  const [topInviters, setTopInviters] = useState<
    Array<{ name: string; count: number; email: string; successfulCount: number }>
  >([]);

  // Status breakdown for pie chart
  const [statusBreakdown, setStatusBreakdown] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);

  useEffect(() => {
    fetchAllRecords();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [records, searchQuery, dateFilter]);

  const fetchAllRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get("/referrals", {
        params: { businessArea }, // Filter by businessArea instead of areaId
      });

      if (response.data.success) {
        const data = response.data.data || [];
        setRecords(data);
      }
    } catch (error: any) {
      console.error("Error fetching invite records:", error);
      toast.error(
        error.response?.data?.message || "Failed to load invite records"
      );
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
      case "30days":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "tilldate":
        startDate.setFullYear(2020, 0, 1); // Start from 2020
        break;
    }

    return { startDate, endDate };
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Date filter
    const { startDate, endDate } = getDateRange(dateFilter);
    filtered = filtered.filter((record) => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.referral?.toLowerCase().includes(query) ||
          record.telephone?.toLowerCase().includes(query) ||
          record.email?.toLowerCase().includes(query) ||
          `${record.from?.fname} ${record.from?.lname}`
            .toLowerCase()
            .includes(query) ||
          `${record.to?.fname} ${record.to?.lname}`
            .toLowerCase()
            .includes(query) ||
          record.from?.companyName?.toLowerCase().includes(query) ||
          record.to?.companyName?.toLowerCase().includes(query)
      );
    }

    setFilteredRecords(filtered);
  };

  const calculateStats = () => {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last15Days = records.filter(
      (r) => new Date(r.createdAt) >= fifteenDaysAgo
    ).length;
    const last30Days = records.filter(
      (r) => new Date(r.createdAt) >= thirtyDaysAgo
    ).length;

    setStats({
      totalInvites: records.length,
      last15DaysCount: last15Days,
      last30DaysCount: last30Days,
      allTimeCount: records.length,
    });

    // Calculate top inviters with success rate
    const inviterCounts = new Map<
      string,
      { count: number; name: string; email: string; successfulCount: number }
    >();
    records.forEach((record) => {
      if (record.from) {
        const key = record.from._id;
        const existing = inviterCounts.get(key);
        const isSuccessful = record.status === "Got the business";

        if (existing) {
          existing.count++;
          if (isSuccessful) {
            existing.successfulCount++;
          }
        } else {
          inviterCounts.set(key, {
            count: 1,
            name: `${record.from.fname} ${record.from.lname}`,
            email: record.from.email,
            successfulCount: isSuccessful ? 1 : 0,
          });
        }
      }
    });

    // Sort by success rate percentage (highest percentage first)
    const sorted = Array.from(inviterCounts.values())
      .map((inviter) => ({
        ...inviter,
        successRate: inviter.count > 0
          ? Math.round((inviter.successfulCount / inviter.count) * 100)
          : 0
      }))
      .sort((a, b) => {
        // Primary sort: Success rate (highest first)
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }
        // Secondary sort: If success rates are equal, sort by total count
        return b.count - a.count;
      })
      .slice(0, 5);
    setTopInviters(sorted);

    // Calculate status breakdown for pie chart
    const statusCounts = {
      "Got the business": 0,
      "Contacted": 0,
      "No Response": 0,
      "Not Contacted Yet": 0,
    };

    records.forEach((record) => {
      const status = record.status || "Not Contacted Yet";
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      } else {
        statusCounts["Not Contacted Yet"]++;
      }
    });

    const chartData = [
      { name: "Got the business", value: statusCounts["Got the business"], color: "#4caf50" },
      { name: "Contacted", value: statusCounts["Contacted"], color: "#2196f3" },
      { name: "No Response", value: statusCounts["No Response"], color: "#ff9800" },
      { name: "Not Contacted Yet", value: statusCounts["Not Contacted Yet"], color: "#9e9e9e" },
    ].filter(item => item.value > 0); // Only show statuses that have data

    setStatusBreakdown(chartData);
  };


  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Got the business":
        return "success";
      case "Contacted":
        return "info";
      case "No Response":
        return "warning";
      case "Not Contacted Yet":
        return "default";
      default:
        return "default";
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Inviter",
      "Invited To",
      "Referred Person",
      "Contact No",
      "Status",
    ];

    const rows = filteredRecords.map((record) => [
      new Date(record.createdAt).toLocaleDateString(),
      `${record.from?.fname || ""} ${record.from?.lname || ""}`.trim(),
      `${record.to?.fname || ""} ${record.to?.lname || ""}`.trim(),
      record.referral || "",
      record.telephone || "",
      record.status || "Not Contacted Yet",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invite-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("CSV exported successfully");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Invite Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track and analyze member invites and business connections
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    backgroundColor: "#e3f2fd",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <TrendingUp size={24} color="#1976d2" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalInvites}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Invites
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    backgroundColor: "#f3e5f5",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Calendar size={24} color="#9c27b0" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.last15DaysCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 15 Days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    backgroundColor: "#e8f5e9",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Users size={24} color="#4caf50" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.last30DaysCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 30 Days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    backgroundColor: "#fff3e0",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <TrendingUp size={24} color="#ff9800" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {topInviters.length > 0 ? topInviters[0].count : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Top Inviter
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Inviters & Status Breakdown */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top 5 Inviters
              </Typography>
              {topInviters.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Successful</TableCell>
                      <TableCell align="left">Success Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topInviters.map((inviter, index) => {
                      const successRate = inviter.count > 0
                        ? Math.round((inviter.successfulCount / inviter.count) * 100)
                        : 0;

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              color={index === 0 ? "primary" : "default"}
                            />
                          </TableCell>
                          <TableCell>{inviter.name}</TableCell>
                          <TableCell>{inviter.email}</TableCell>
                          <TableCell align="right">
                            <strong>{inviter.count}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={inviter.successfulCount}
                              size="small"
                              color="success"
                              sx={{ fontWeight: 600, minWidth: 45 }}
                            />
                          </TableCell>
                          <TableCell align="left">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  flex: 1,
                                  height: 8,
                                  backgroundColor: '#e0e0e0',
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  maxWidth: 100,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${successRate}%`,
                                    height: '100%',
                                    backgroundColor:
                                      successRate >= 75 ? '#4caf50' :
                                        successRate >= 50 ? '#2196f3' :
                                          successRate >= 25 ? '#ff9800' : '#f44336',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" fontWeight="600" sx={{ minWidth: 40 }}>
                                {successRate}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary" align="center" py={3}>
                  No invites found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status Breakdown Pie Chart */}
        <Grid item xs={12} md={6}>
          <StatusBreakdownChart data={statusBreakdown} />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name, phone, email, company..."
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
                fullWidth
                select
                label="Date Range"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as DateFilterType)
                }
              >
                <MenuItem value="15days">Last 15 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
                <MenuItem value="tilldate">All Time</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportCSV}
                  disabled={filteredRecords.length === 0}
                >
                  Export CSV
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>Date</TableCell>
                <TableCell>Inviter</TableCell>
                <TableCell>Invited To</TableCell>
                <TableCell>Referred Person</TableCell>
                <TableCell>Contact No</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary">
                      No invites found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow
                    key={record._id}
                    hover
                  >
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(record.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {`${record.from?.fname || ""} ${record.from?.lname || ""}`.trim()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.from?.companyName || "N/A"}
                      </Typography>
                      <br />
                      <Chip
                        label={record.from?.membershipType || "N/A"}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {`${record.to?.fname || ""} ${record.to?.lname || ""}`.trim()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.to?.companyName || "N/A"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {record.referral}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Phone size={14} />
                        <Typography variant="body2">
                          {record.telephone}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={record.status || "Not Contacted Yet"}
                        size="small"
                        color={getStatusColor(record.status)}
                        sx={{ fontWeight: 600 }}
                      />
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

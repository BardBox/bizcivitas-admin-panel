import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {

  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  Event,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";
import axiosInstance from "../../axiosInstance";
import ChartsView from "./ChartsView";
import { useVisibility } from "../../context/VisibilityContext";

// Role-based dashboard types
type DashboardRole = "master-franchise" | "area-franchise";

// Helper function to determine dashboard role
const getDashboardRole = (user: any): DashboardRole | null => {
  if (!user || !user.role) return null;

  if (user.role === "master-franchise") return "master-franchise";
  if (user.role === "area-franchise") return "area-franchise";

  return null;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface DashboardData {
  zone: {
    id: string;
    name: string;
    city: string;
    state: string;
    country: string;
    status: string;
  };
  masterFranchise: {
    _id: string;
    fname: string;
    lname?: string;
    email: string;
    phone: string;
    businessCategory: string;
  };
  summary: {
    totalAreas: number;
    activeAreas: number;
    totalMembers: number;
    offlineMembers: number;
    digitalMembers: number;
  };
  metrics: {
    period: string;
    membershipFilter: string;
    startDate: Date;
    endDate: Date;
    zoneWide?: {
      totalMeetups: number;
      totalBizConnect: number;
      totalBizWinAmount: number;
      totalVisitorInvitations: number;
      totalEvents: number;
      avgPerformanceScore: number;
      userCount: number;
    };
    areaWide?: {
      totalMeetups: number;
      totalBizConnect: number;
      totalBizWinAmount: number;
      totalVisitorInvitations: number;
      totalEvents: number;
      avgPerformanceScore: number;
      userCount: number;
    };
  };
  areaFranchises: Array<{
    areaId: string;
    areaName: string;
    areaCode: string;
    status: string;
    areaFranchise: {
      _id: string;
      fname: string;
      lname?: string;
      email: string;
      phoneNumber: string;
      businessCategory: string;
      avatar?: string;
    } | null;
    metrics: {
      totalMeetups: number;
      totalBizConnect: number;
      totalBizWinAmount: number;
      totalVisitorInvitations: number;
      totalEvents: number;
      avgPerformanceScore: number;
      userCount: number;
    } | null;
  }>;
  topPerformers: Array<any>;
}

const DashboardFranchise: React.FC = () => {
  const navigate = useNavigate();
  const user = getUserFromLocalStorage();
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [membershipFilter, setMembershipFilter] = useState<"total" | "offline" | "digital">("total");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect user role
  const dashboardRole = getDashboardRole(user);

  // Ensure sidebar and header are visible
  useEffect(() => {
    setSidebarAndHeaderVisibility(true);
  }, [setSidebarAndHeaderVisibility]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate role
        if (!dashboardRole) {
          setError("Invalid user role. Only Master Franchise and Area Franchise partners can access this dashboard.");
          setLoading(false);
          return;
        }

        // Determine endpoint based on role
        const endpoint =
          dashboardRole === "master-franchise"
            ? "/franchise/mf/dashboard"
            : "/franchise/af/dashboard";

        console.log(`Fetching dashboard data from ${endpoint} for role: ${dashboardRole}`);

        const response = await axiosInstance.get(endpoint, {
          params: {
            period,
            membershipFilter,
          },
        });

        console.log("Dashboard API response:", response.data);

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [period, membershipFilter, dashboardRole]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }



  // No data state
  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No dashboard data available</Alert>
      </Box>
    );
  }

  const metricsData = dashboardData.metrics.zoneWide || dashboardData.metrics.areaWide || {
    totalMeetups: 0,
    totalBizConnect: 0,
    totalBizWinAmount: 0,
    totalVisitorInvitations: 0,
    totalEvents: 0,
    avgPerformanceScore: 0,
    userCount: 0,
  };

  // Dynamic title based on role
  const getDashboardTitle = () => {
    if (dashboardRole === "master-franchise") {
      return `Master Franchise Partner Dashboard - ${dashboardData.zone.name}`;
    } else if (dashboardRole === "area-franchise") {
      return `Area Franchise Partner Dashboard - ${dashboardData.zone?.name || "Your Area"}`;
    }
    return "Franchise Dashboard";
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.fname} {user?.lname}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {getDashboardTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {dashboardRole === "master-franchise" && `Areas: ${dashboardData.summary.totalAreas} | `}
            Total Members: {dashboardData.summary.totalMembers}
            {" ("}Offline: {dashboardData.summary.offlineMembers}, Digital: {dashboardData.summary.digitalMembers}{")"}
          </Typography>
        </Box>

        {/* Filter Controls */}
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value as any)}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={membershipFilter}
            exclusive
            onChange={(_, value) => value && setMembershipFilter(value)}
            size="small"
          >
            <ToggleButton value="total">Total</ToggleButton>
            <ToggleButton value="offline">Offline</ToggleButton>
            <ToggleButton value="digital">Digital</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Zone-Level Key Metrics Overview */}
      <Grid container spacing={3} mt={2}>
        {/* M.U. - Meetups */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Groups />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {metricsData.totalMeetups}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                M.U. (Meetups)
              </Typography>
              <Box mt={2} display="flex" justifyContent="center" sx={{ fontSize: "0.75rem" }}>
                <span>{period.charAt(0).toUpperCase() + period.slice(1)} Total</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.C. - BizConnect */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Handshake />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {metricsData.totalBizConnect}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2} display="flex" justifyContent="center" sx={{ fontSize: "0.75rem" }}>
                <span>{period.charAt(0).toUpperCase() + period.slice(1)} Total</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.W. - BizWin */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <EmojiEvents />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(metricsData.totalBizWinAmount)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2} display="flex" justifyContent="center" sx={{ fontSize: "0.75rem" }}>
                <span>{period.charAt(0).toUpperCase() + period.slice(1)} Total</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* VISITOR - Invitations */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Visibility />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {metricsData.totalVisitorInvitations}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                VISITOR (Invitations)
              </Typography>
              <Box mt={2} display="flex" justifyContent="center" sx={{ fontSize: "0.75rem" }}>
                <span>{period.charAt(0).toUpperCase() + period.slice(1)} Total</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* EVE - Events */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Event />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {metricsData.totalEvents}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                EVE (Events)
              </Typography>
              <Box mt={2} display="flex" justifyContent="center" sx={{ fontSize: "0.75rem" }}>
                <span>{period.charAt(0).toUpperCase() + period.slice(1)} Total</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for detailed views */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          {dashboardRole === "master-franchise" ? (
            <>
              <Tab label="Area Performance" />
              <Tab label="Area-wise Metrics" />
              <Tab label="Commission Details" />
              <Tab label="Charts" />
            </>
          ) : (
            <>
              <Tab label="Performance Overview" />
              <Tab label="Detailed Metrics" />
            </>
          )}
        </Tabs>

        {/* Area Performance Tab (Master Franchise only) */}
        {dashboardRole === "master-franchise" && (
          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Area Name</strong></TableCell>
                    <TableCell><strong>AF Partner</strong></TableCell>
                    <TableCell align="center"><strong>DCPs</strong></TableCell>
                    <TableCell align="center"><strong>Core Groups</strong></TableCell>
                    <TableCell align="center"><strong>Members</strong></TableCell>
                    <TableCell align="center"><strong>Performance</strong></TableCell>
                    <TableCell align="center"><strong>Trend</strong></TableCell>
                    <TableCell align="right"><strong>Commission</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.areaFranchises.map((area) => (
                    <TableRow key={area.areaId} hover>
                      <TableCell><strong>{area.areaName}</strong></TableCell>
                      <TableCell>
                        {area.areaFranchise ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              src={area.areaFranchise.avatar}
                              sx={{ width: 32, height: 32 }}
                            >
                              {area.areaFranchise.fname?.charAt(0) || "U"}
                            </Avatar>
                            {`${area.areaFranchise.fname} ${area.areaFranchise.lname || ""}`}
                          </Box>
                        ) : (
                          <Chip label="Not Assigned" size="small" color="warning" />
                        )}
                      </TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">{area.metrics?.userCount || 0}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: "100%", mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={area.metrics?.avgPerformanceScore || 0}
                              color={(area.metrics?.avgPerformanceScore || 0) > 85 ? "success" : "primary"}
                            />
                          </Box>
                          <Typography variant="body2">{Math.round(area.metrics?.avgPerformanceScore || 0)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/dashboard-franchise/area/${area.areaId}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}

        {/* Area-wise Metrics Tab (Master Franchise only) */}
        {dashboardRole === "master-franchise" && (
          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Area Name</strong></TableCell>
                    <TableCell align="center"><strong>Meetups</strong></TableCell>
                    <TableCell align="center"><strong>BizConnect</strong></TableCell>
                    <TableCell align="center"><strong>BizWin Amount</strong></TableCell>
                    <TableCell align="center"><strong>Visitor Invitations</strong></TableCell>
                    <TableCell align="center"><strong>Events</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.areaFranchises.map((area) => (
                    <TableRow key={area.areaId} hover>
                      <TableCell><strong>{area.areaName}</strong></TableCell>
                      <TableCell align="center">
                        <Chip label={area.metrics?.totalMeetups || 0} color="primary" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={area.metrics?.totalBizConnect || 0} color="secondary" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                          {formatCurrency(area.metrics?.totalBizWinAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={area.metrics?.totalVisitorInvitations || 0} color="warning" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={area.metrics?.totalEvents || 0} color="info" />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Zone Total</strong></TableCell>
                    <TableCell align="center">
                      <Chip
                        label={metricsData.totalMeetups}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={metricsData.totalBizConnect}
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {formatCurrency(metricsData.totalBizWinAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={metricsData.totalVisitorInvitations}
                        color="warning"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={metricsData.totalEvents}
                        color="info"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}

        {/* Commission Details Tab (Master Franchise only) */}
        {dashboardRole === "master-franchise" && (
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* Commission by Area */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Commission by Area
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Area</strong></TableCell>
                          <TableCell align="right"><strong>Members</strong></TableCell>
                          <TableCell align="right"><strong>BizWin Generated</strong></TableCell>
                          <TableCell align="right"><strong>Commission Earned</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.areaFranchises.map((area) => (
                          <TableRow key={area.areaId}>
                            <TableCell>{area.areaName}</TableCell>
                            <TableCell align="right">{area.metrics?.userCount || 0}</TableCell>
                            <TableCell align="right">{formatCurrency(area.metrics?.totalBizWinAmount || 0)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main" }}>
                              {/* Commission calculation pending - will be added in future */}
                              ₹0
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right">
                            <strong>{dashboardData.summary.totalMembers}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(metricsData.totalBizWinAmount)}</strong>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main", fontSize: "1.1rem" }}>
                            {/* Total commission calculation pending */}
                            ₹0
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Payout Summary */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Commission Breakdown
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Offline Members ({dashboardData.summary.offlineMembers}):</Typography>
                      <Typography fontWeight="bold">₹0</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Digital Members ({dashboardData.summary.digitalMembers}):</Typography>
                      <Typography fontWeight="bold">₹0</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" sx={{ pt: 2, borderTop: "2px solid #e0e0e0" }}>
                      <Typography variant="h6">Total Commission:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        ₹0
                      </Typography>
                    </Box>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Commission calculation feature coming soon
                    </Alert>
                  </Box>
                </Paper>

                <Paper sx={{ p: 3, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Payout Status
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Pending Payouts:</Typography>
                      <Chip label="₹0" color="warning" />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Completed Payouts:</Typography>
                      <Chip label="₹0" color="success" />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Next Payout Date:</Typography>
                      <Typography fontWeight="bold">-</Typography>
                    </Box>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Payout tracking feature coming soon
                    </Alert>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        )}

        {/* Charts Tab (Master Franchise only) */}
        {dashboardRole === "master-franchise" && (
          <TabPanel value={tabValue} index={3}>
            <ChartsView dashboardRole={dashboardRole} />
          </TabPanel>
        )}

        {/* Area Franchise Performance Overview Tab */}
        {dashboardRole === "area-franchise" && (
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Total Members:</Typography>
                        <Typography fontWeight="bold">{dashboardData.summary.totalMembers}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Offline Members:</Typography>
                        <Typography fontWeight="bold">{dashboardData.summary.offlineMembers}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Digital Members:</Typography>
                        <Typography fontWeight="bold">{dashboardData.summary.digitalMembers}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Avg Performance Score:</Typography>
                        <Typography fontWeight="bold">
                          {Math.round(metricsData.avgPerformanceScore || 0)}%
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Total BizWin:</Typography>
                        <Typography fontWeight="bold" color="success.main">
                          {formatCurrency(metricsData.totalBizWinAmount)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        )}

        {/* Area Franchise Detailed Metrics Tab */}
        {dashboardRole === "area-franchise" && (
          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Metric</strong></TableCell>
                    <TableCell align="center"><strong>Count</strong></TableCell>
                    <TableCell align="center"><strong>Period</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>M.U. (Meetups)</strong></TableCell>
                    <TableCell align="center">
                      <Chip label={metricsData.totalMeetups} color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>B.C. (BizConnect)</strong></TableCell>
                    <TableCell align="center">
                      <Chip label={metricsData.totalBizConnect} color="secondary" />
                    </TableCell>
                    <TableCell align="center">
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>B.W. (BizWin)</strong></TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        {formatCurrency(metricsData.totalBizWinAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>VISITOR (Invitations)</strong></TableCell>
                    <TableCell align="center">
                      <Chip label={metricsData.totalVisitorInvitations} color="warning" />
                    </TableCell>
                    <TableCell align="center">
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>EVE (Events)</strong></TableCell>
                    <TableCell align="center">
                      <Chip label={metricsData.totalEvents} color="info" />
                    </TableCell>
                    <TableCell align="center">
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}
      </Box>
    </Box>
  );
};

export default DashboardFranchise;

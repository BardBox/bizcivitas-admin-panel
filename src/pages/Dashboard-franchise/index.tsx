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
import CommissionDistributionTab from "./CommissionDistributionTab";

// Role-based dashboard types
type DashboardRole = "admin" | "master-franchise" | "area-franchise";

// Helper function to determine dashboard role
const getDashboardRole = (user: any): DashboardRole | null => {
  if (!user || !user.role) return null;

  if (user.role === "admin") return "admin";
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
  // Detect user role
  const dashboardRole = getDashboardRole(user);
  const isAdmin = user?.role === "admin";

  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "all-time">(isAdmin || dashboardRole === "master-franchise" ? "all-time" : "monthly");
  const [membershipFilter, setMembershipFilter] = useState<"total" | "offline" | "digital">("total");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError("Invalid user role. Only Admin, Master Franchise and Area Franchise partners can access this dashboard.");
          setLoading(false);
          return;
        }

        // For admin, fetch all zones AND global metrics
        if (isAdmin) {
          const [zonesResponse, metricsResponse] = await Promise.all([
            axiosInstance.get("/zones"),
            axiosInstance.get("/franchise/admin/global-metrics", {
              params: { period }
            })
          ]);

          console.log("Admin zones response:", zonesResponse.data);
          console.log("Admin metrics response:", metricsResponse.data);

          if (zonesResponse.data.success) {
            setZones(zonesResponse.data.data.zones || []);
          }

          if (metricsResponse.data.success) {
            // Map global metrics to dashboard data structure
            const globalMetrics = metricsResponse.data.data.metrics;
            setDashboardData({
              zone: { id: "", name: "Global", city: "", state: "", country: "", status: "" },
              masterFranchise: { _id: "", fname: "", email: "", phone: "", businessCategory: "" },
              summary: { totalAreas: 0, activeAreas: 0, totalMembers: globalMetrics.userCount, offlineMembers: 0, digitalMembers: 0 },
              metrics: {
                period,
                membershipFilter: "total",
                startDate: new Date(),
                endDate: new Date(),
                zoneWide: {
                  totalMeetups: globalMetrics.meetups.total,
                  totalBizConnect: globalMetrics.bizConnect.total,
                  totalBizWinAmount: globalMetrics.bizWin.totalAmount,
                  totalVisitorInvitations: globalMetrics.visitorInvitations.total,
                  totalEvents: 0, // Not currently in global metrics response, defaulting to 0
                  avgPerformanceScore: 0,
                  userCount: globalMetrics.userCount
                }
              },
              areaFranchises: [],
              topPerformers: []
            });
          }
        } else {
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
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [period, membershipFilter, dashboardRole, isAdmin]);

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



  // Admin view - show all zones
  if (isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Welcome Section */}
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome, {user?.fname} {user?.lname}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Franchise Management Dashboard - All Zones
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Zones: {zones.length}
            </Typography>
          </Box>

          {/* Filter Controls for Global Stats */}
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Period</InputLabel>
              <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value as any)}>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="all-time">All Time</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Global Stats Cards */}
        {dashboardData?.metrics?.zoneWide && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              mb: 4,
              justifyContent: "space-between",
            }}
          >
            {[
              {
                title: "M.U. (Meetups)",
                value: dashboardData.metrics.zoneWide.totalMeetups,
                icon: <Groups fontSize="large" />,
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                subtext: `${period === 'all-time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)} Total`
              },
              {
                title: "B.C. (BizConnect)",
                value: dashboardData.metrics.zoneWide.totalBizConnect,
                icon: <Handshake fontSize="large" />,
                gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                subtext: `${period === 'all-time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)} Total`
              },
              {
                title: "B.W. (BizWin)",
                value: formatCurrency(dashboardData.metrics.zoneWide.totalBizWinAmount),
                icon: <EmojiEvents fontSize="large" />,
                gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                subtext: `${period === 'all-time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)} Total`
              },
              {
                title: "VISITOR (Invitations)",
                value: dashboardData.metrics.zoneWide.totalVisitorInvitations,
                icon: <Visibility fontSize="large" />,
                gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                subtext: `${period === 'all-time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)} Total`
              },
              {
                title: "Total Members",
                value: dashboardData.metrics.zoneWide.userCount,
                icon: <Groups fontSize="large" />,
                gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
                subtext: "Platform Wide"
              }
            ].map((item, index) => (
              <Card
                key={index}
                sx={{
                  flex: "1 1 200px",
                  minHeight: 160,
                  background: item.gradient,
                  color: "white",
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", p: 2.5 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box sx={{ opacity: 0.9 }}>{item.icon}</Box>
                    <Chip
                      label={item.subtext}
                      size="small"
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.25)",
                        color: "white",
                        fontSize: "0.65rem",
                        height: 22,
                        fontWeight: 500
                      }}
                    />
                  </Box>
                  <Box mt={2}>
                    <Typography variant="h4" fontWeight="700" sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ opacity: 0.9, mt: 0.5 }}>
                      {item.title}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Zones List */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Zone Name</strong></TableCell>
                <TableCell><strong>Zone Code</strong></TableCell>
                <TableCell><strong>City</strong></TableCell>
                <TableCell><strong>State</strong></TableCell>
                <TableCell><strong>Country</strong></TableCell>
                <TableCell><strong>Master Franchise</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {zones.map((zone) => (
                <TableRow
                  key={zone._id}
                  hover
                  onClick={() => navigate(`/dashboard-franchise/zone/${zone._id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell><strong>{zone.zoneName}</strong></TableCell>
                  <TableCell>{zone.zoneCode}</TableCell>
                  <TableCell>{zone.cityId || "N/A"}</TableCell>
                  <TableCell>{zone.stateId || "N/A"}</TableCell>
                  <TableCell>{zone.countryId || "N/A"}</TableCell>
                  <TableCell>
                    {zone.assignedMFId ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {zone.assignedMFId.fname?.[0] || "M"}
                        </Avatar>
                        {zone.assignedMFId.fname} {zone.assignedMFId.lname}
                      </Box>
                    ) : (
                      <Chip label="Not Assigned" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard-franchise/zone/${zone._id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {zones.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>No zones found</Alert>
        )}
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
              <MenuItem value="all-time">All Time</MenuItem>
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
            <CommissionDistributionTab
              zoneName={dashboardData.zone.name}
              userRole={dashboardRole}
            />
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

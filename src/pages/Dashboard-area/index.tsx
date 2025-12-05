import React, { useState, useEffect, useRef } from "react";
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
  CircularProgress,
  Alert,
  TextField,
  Button,
  Stack,
  MenuItem,
} from "@mui/material";
import {
  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  Download,
  People,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";
import { useParams } from "react-router-dom";
import { useVisibility } from "../../context/VisibilityContext";
import axiosInstance from "../../axiosInstance";
import { generateUserMetricsReport, generateAreaMetricsReport } from "../../utils/excelReportGenerator";

interface AreaMetrics {
  bizWinTransactions: {
    total: number;
    given: number;
    received: number;
    totalAmount: number;
    givenAmount: number;
    receivedAmount: number;
  };
  bizConnectMeetups: {
    total: number;
    given: number;
    received: number;
  };
  meetups: {
    total: number;
  };
  visitorInvitations: {
    total: number;
  };
  memberReferrals: {
    total: number;
  };
  userCount: number;
}

interface AreaData {
  _id: string;
  areaName: string;
  areaCode: string;
  status: string;
  zoneId: {
    zoneName: string;
  };
  areaFranchise?: {
    fname: string;
    lname: string;
  };
  dcps?: Array<{
    _id: string;
    fname: string;
    lname: string;
    email: string;
  }>;
  coreGroups?: Array<{
    _id: string;
    groupName: string;
    memberCount: number;
  }>;
}

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

const DashboardArea: React.FC = () => {
  const user = React.useMemo(() => getUserFromLocalStorage(), []);
  const { areaId } = useParams();
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaData, setAreaData] = useState<AreaData | null>(null);
  const [metrics, setMetrics] = useState<AreaMetrics | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userMetrics, setUserMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [isRefetching, setIsRefetching] = useState(false);

  const dataLoadedRef = useRef(false);

  useEffect(() => {
    setSidebarAndHeaderVisibility(true);
  }, [setSidebarAndHeaderVisibility]);

  const fetchAreaData = React.useCallback(async () => {
    let targetAreaId = areaId;

    // If no areaId in params, check if user is Area Franchise and has areaId
    if (!targetAreaId && user?.role === 'area-franchise') {
      const franchiseUser = user as any;
      if (franchiseUser.areaId) {
        targetAreaId = typeof franchiseUser.areaId === 'object' ? franchiseUser.areaId._id : franchiseUser.areaId;
      }
    }

    if (!targetAreaId) {
      setError("Area ID is required");
      setLoading(false);
      return;
    }

    // Determine if this is an initial load or a refresh using ref
    const isInitialLoad = !dataLoadedRef.current;

    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      // First, fetch the area details to get the areaName
      const areaResponse = await axiosInstance.get(`/franchise/area/${targetAreaId}`);
      const area: AreaData = areaResponse.data.data;
      setAreaData(area);

      console.log("📍 Area Data:", area);

      // Extract clean area name (remove city suffix if present)
      // e.g., "Jawahar Nagar (Vadodara)" -> "Jawahar Nagar"
      const cleanAreaName = area.areaName.split(' (')[0].trim();
      console.log("🔍 Clean Area Name for Query:", cleanAreaName);

      // Then fetch metrics for this business area
      const metricsResponse = await axiosInstance.get(
        `/franchise/mf/area-metrics`,
        {
          params: {
            businessArea: cleanAreaName,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        }
      );

      const metricsData: AreaMetrics = metricsResponse.data.data.metrics;
      setMetrics(metricsData);

      // Mark data as loaded so subsequent fetches are treated as refetches
      dataLoadedRef.current = true;

      console.log("📊 Area Metrics:", metricsData);

      // Fetch users in this area
      fetchAreaUsers(cleanAreaName);
    } catch (err: any) {
      console.error("Error fetching area data:", err);
      setError(
        err?.response?.data?.message ||
        "Failed to fetch area data. Please try again."
      );
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [areaId, dateRange, user]);

  const fetchAreaUsers = async (areaName: string) => {
    try {
      setLoadingUsers(true);
      const response = await axiosInstance.get("/users/getallusers", {
        params: {
          businessArea: areaName,
        },
      });

      console.log("👥 Area Users:", response.data);
      setUsers(response.data.data?.users || []);
    } catch (err: any) {
      console.error("Error fetching area users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUserMetrics = async (userId: string) => {
    try {
      setLoadingMetrics(true);

      // Fetch user referral and TYFCB stats (combined endpoint)
      const response = await axiosInstance.get(`/dashboard/user-referralstate/${userId}`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }
      });

      const data = response.data.data || {};

      const metrics = {
        referrals: {
          referralsGiven: data.givenReferrals || 0,
          referralsReceived: data.receivedReferrals || 0,
        },
        tyfcb: {
          givenCount: data.givenTYFCB || 0,
          receivedCount: data.receivedTYFCB || 0,
          givenAmount: data.givenTYFCBAmount || 0,
          receivedAmount: data.receivedTYFCBAmount || 0,
          totalAmount: data.totalTYFCBAmount || 0,
        },
        meetups: data.meetupsCount || 0,
        visitorInvitations: data.visitorInvitations || 0,
        memberReferrals: data.memberReferrals || 0,
      };

      console.log("✅ User Metrics:", metrics);
      setUserMetrics(metrics);
    } catch (err: any) {
      console.error("Error fetching user metrics:", err);
      setUserMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleUserClick = (userData: any) => {
    setSelectedUser(userData);
    fetchUserMetrics(userData.user.userId);
    // Scroll to top to see the updated metrics cards
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async () => {
    if (selectedUser && userMetrics) {
      // User-specific download with detailed transaction data
      await generateUserMetricsReport(
        selectedUser.user.userId,
        selectedUser.user.name,
        userMetrics,
        selectedUser.user.membershipType,
        dateRange
      );
    } else if (metrics && areaData) {
      // Area-wide download
      generateAreaMetricsReport(areaData.areaName, metrics);
    }
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setUserMetrics(null);
  };

  useEffect(() => {
    fetchAreaData();
  }, [fetchAreaData]);

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

  // State to store membership-filtered metrics
  const [filteredMetrics, setFilteredMetrics] = useState<AreaMetrics | null>(null);

  // Fetch filtered metrics when membership filter changes
  useEffect(() => {
    const fetchFilteredMetrics = async () => {
      if (membershipFilter === "all" || !areaData || !metrics) {
        setFilteredMetrics(null);
        return;
      }

      try {

        // Filter users by membership type
        const filteredUsers = users.filter(
          (userData: any) => userData.user.membershipType === membershipFilter
        );

        if (filteredUsers.length === 0) {
          setFilteredMetrics({
            bizWinTransactions: { total: 0, given: 0, received: 0, totalAmount: 0, givenAmount: 0, receivedAmount: 0 },
            bizConnectMeetups: { total: 0, given: 0, received: 0 },
            meetups: { total: 0 },
            visitorInvitations: { total: 0 },
            memberReferrals: { total: 0 },
            userCount: 0,
          });
          return;
        }

        // Fetch metrics for each filtered user and aggregate
        const userMetricsPromises = filteredUsers.map((userData: any) =>
          axiosInstance.get(`/dashboard/user-referralstate/${userData.user.userId}`, {
            params: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
            }
          }).catch(() => null)
        );

        const userMetricsResponses = await Promise.all(userMetricsPromises);

        // Aggregate metrics
        let totalBizConnectGiven = 0;
        let totalBizConnectReceived = 0;
        let totalBizWinGiven = 0;
        let totalBizWinReceived = 0;
        let totalBizWinGivenAmount = 0;
        let totalBizWinReceivedAmount = 0;
        let totalMeetups = 0;
        let totalVisitorInvitations = 0;
        let totalMemberReferrals = 0;

        userMetricsResponses.forEach((response) => {
          if (response && response.data && response.data.data) {
            const data = response.data.data;
            totalBizConnectGiven += data.givenReferrals || 0;
            totalBizConnectReceived += data.receivedReferrals || 0;
            totalBizWinGiven += data.givenTYFCB || 0;
            totalBizWinReceived += data.receivedTYFCB || 0;
            totalBizWinGivenAmount += data.givenTYFCBAmount || 0;
            totalBizWinReceivedAmount += data.receivedTYFCBAmount || 0;
            totalMeetups += data.meetupsCount || 0;
            totalVisitorInvitations += data.visitorInvitations || 0;
            totalMemberReferrals += data.memberReferrals || 0;
          }
        });

        setFilteredMetrics({
          bizWinTransactions: {
            total: totalBizWinGiven + totalBizWinReceived,
            given: totalBizWinGiven,
            received: totalBizWinReceived,
            totalAmount: totalBizWinGivenAmount + totalBizWinReceivedAmount,
            givenAmount: totalBizWinGivenAmount,
            receivedAmount: totalBizWinReceivedAmount,
          },
          bizConnectMeetups: {
            total: totalBizConnectGiven + totalBizConnectReceived,
            given: totalBizConnectGiven,
            received: totalBizConnectReceived,
          },
          meetups: {
            total: totalMeetups,
          },
          visitorInvitations: {
            total: totalVisitorInvitations,
          },
          memberReferrals: {
            total: totalMemberReferrals,
          },
          userCount: filteredUsers.length,
        });
      } catch (err) {
        console.error("Error fetching filtered metrics:", err);
      }
    };

    fetchFilteredMetrics();
  }, [membershipFilter, users, areaData, metrics, dateRange]);

  const displayMetrics = filteredMetrics || metrics;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!areaData || !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No data available for this area.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      {isRefetching && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}
      {/* Welcome Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.fname} {user?.lname}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Area Franchise Partner Dashboard - {areaData.areaName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Zone: {areaData.zoneId?.zoneName || "N/A"} | DCPs: {areaData.dcps?.length || 0} | Core Groups:{" "}
            {areaData.coreGroups?.length || 0} | Members: {displayMetrics?.userCount || 0}
          </Typography>
        </Box>
        {selectedUser && (
          <Box>
            <Chip
              label={`Viewing: ${selectedUser.user.name}`}
              onDelete={handleClearSelection}
              color="primary"
              sx={{ fontSize: '0.9rem', py: 2 }}
            />
          </Box>
        )}
      </Box>

      {/* Date Filter & Download */}
      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="Membership Type"
            size="small"
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Memberships</MenuItem>
            <MenuItem value="Core Membership">Core Membership</MenuItem>
            <MenuItem value="Flagship Membership">Flagship Membership</MenuItem>
            <MenuItem value="Digital Membership">Digital Membership</MenuItem>
            <MenuItem value="Industrial Membership">Industrial Membership</MenuItem>
          </TextField>
          <TextField
            label="Start Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
          <TextField
            label="End Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
          >
            Download Report
          </Button>
        </Stack>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} mt={2}>
        {/* M.U. - Meetups */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", position: 'relative' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Groups />
                {loadingMetrics && selectedUser && (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                )}
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {selectedUser && userMetrics ? userMetrics.meetups : displayMetrics?.meetups.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                M.U. (Meetups)
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* B.C. - BizConnect */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white", position: 'relative' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Handshake />
                {loadingMetrics && selectedUser && (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                )}
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {selectedUser && userMetrics
                  ? (userMetrics.referrals.referralsGiven + userMetrics.referrals.referralsReceived)
                  : displayMetrics?.bizConnectMeetups.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Given: {selectedUser && userMetrics ? userMetrics.referrals.referralsGiven : displayMetrics?.bizConnectMeetups.given}</span>
                <span>Received: {selectedUser && userMetrics ? userMetrics.referrals.referralsReceived : displayMetrics?.bizConnectMeetups.received}</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.W. - BizWin */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white", position: 'relative' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <EmojiEvents />
                {loadingMetrics && selectedUser && (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                )}
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {selectedUser && userMetrics
                  ? formatCurrency(userMetrics.tyfcb.totalAmount)
                  : formatCurrency(displayMetrics?.bizWinTransactions.totalAmount || 0)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Given: {selectedUser && userMetrics ? formatCurrency(userMetrics.tyfcb.givenAmount) : formatCurrency(displayMetrics?.bizWinTransactions.givenAmount || 0)}</span>
                <span>Received: {selectedUser && userMetrics ? formatCurrency(userMetrics.tyfcb.receivedAmount) : formatCurrency(displayMetrics?.bizWinTransactions.receivedAmount || 0)}</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* VISITOR - Invitations */}
        {(!selectedUser || selectedUser.user.membershipType !== "Digital Membership") && (
          <Grid item xs={12} md={6} lg={2.4}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Visibility />
                  {loadingMetrics && selectedUser && (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  )}
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {selectedUser && userMetrics ? userMetrics.visitorInvitations : displayMetrics?.visitorInvitations.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  VISITOR (Invitations)
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
                  All time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Member Referrals */}
        {(!selectedUser || selectedUser.user.membershipType !== "Digital Membership") && (
          <Grid item xs={12} md={6} lg={2.4}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", color: "white" }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <People />
                  {loadingMetrics && selectedUser && (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  )}
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {selectedUser && userMetrics ? userMetrics.memberReferrals : displayMetrics?.memberReferrals.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Member Referrals
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
                  New members referred
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Tabs for detailed views */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Area Summary" />
          <Tab label="Area Members" />
          <Tab label="DCP Groups" />
          <Tab label="Core Groups" />
        </Tabs>

        {/* Area Summary Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Area Information
                  </Typography>
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Area Name:</Typography>
                      <Typography fontWeight="bold">{areaData.areaName}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Area Code:</Typography>
                      <Typography fontWeight="bold">{areaData.areaCode}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Zone:</Typography>
                      <Typography fontWeight="bold">{areaData.zoneId?.zoneName || "N/A"}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Status:</Typography>
                      <Chip
                        label={areaData.status}
                        color={areaData.status === "active" ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Total Members:</Typography>
                      <Typography fontWeight="bold">{displayMetrics?.userCount}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Area Franchise Partner
                  </Typography>
                  <Box mt={2}>
                    {areaData.areaFranchise ? (
                      <>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ width: 48, height: 48 }}>
                            {areaData.areaFranchise.fname?.[0] || "A"}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {areaData.areaFranchise.fname} {areaData.areaFranchise.lname}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Area Franchise Partner
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Alert severity="info">No Area Franchise Partner assigned yet</Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Area Members Tab */}
        <TabPanel value={tabValue} index={1}>
          {loadingUsers ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (() => {
            // Filter users based on membership type
            const filteredUsers = membershipFilter === "all"
              ? users
              : users.filter((userData: any) => userData.user.membershipType === membershipFilter);

            return filteredUsers.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Member</strong></TableCell>
                      <TableCell><strong>Company</strong></TableCell>
                      <TableCell><strong>Business</strong></TableCell>
                      <TableCell><strong>Membership</strong></TableCell>
                      <TableCell align="center"><strong>Payment Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((userData: any) => {
                      const u = userData.user;
                      const payment = userData.payment;
                      return (
                        <TableRow
                          key={u.userId}
                          hover
                          onClick={() => handleUserClick(userData)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar src={u.avatar} sx={{ width: 32, height: 32 }}>
                                {u.name?.[0] || "U"}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {u.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {u.city}, {u.state}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{u.companyName || "-"}</TableCell>
                          <TableCell>{u.myBusiness || u.industry || "-"}</TableCell>
                          <TableCell>
                            <Chip
                              label={u.membershipType || "N/A"}
                              color={
                                u.membershipType === "Core Membership" ? "success" :
                                  u.membershipType === "Flagship Membership" ? "primary" :
                                    u.membershipType === "Digital Membership" ? "info" :
                                      "default"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {payment?.isFullyPaid ? (
                              <Chip label="Paid" color="success" size="small" />
                            ) : (
                              <Chip
                                label={`₹${payment?.pendingAmount?.toLocaleString() || 0} Pending`}
                                color="warning"
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No members found matching the selected membership type</Alert>
            );
          })()}
        </TabPanel>

        {/* DCP Groups Tab */}
        <TabPanel value={tabValue} index={2}>
          {areaData.dcps && areaData.dcps.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>DCP Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areaData.dcps.map((dcp) => (
                    <TableRow key={dcp._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {dcp.fname?.[0] || "D"}
                          </Avatar>
                          {dcp.fname} {dcp.lname}
                        </Box>
                      </TableCell>
                      <TableCell>{dcp.email}</TableCell>
                      <TableCell align="center">
                        <Chip label="Active" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No DCP Groups assigned to this area yet</Alert>
          )}
        </TabPanel>

        {/* Core Groups Tab */}
        <TabPanel value={tabValue} index={3}>
          {areaData.coreGroups && areaData.coreGroups.length > 0 ? (
            <Grid container spacing={3}>
              {areaData.coreGroups.map((coreGroup, index) => (
                <Grid item xs={12} md={4} key={coreGroup._id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Chip
                          label={`#${index + 1}`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {coreGroup.groupName}
                      </Typography>
                      <Box mt={2}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <People fontSize="small" />
                          <Typography variant="body2">
                            Members: <strong>{coreGroup.memberCount || 0}</strong>
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">No Core Groups assigned to this area yet</Alert>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default DashboardArea;

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
} from "@mui/material";
import {
  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  People,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";
import { useParams, useNavigate } from "react-router-dom";
import { useVisibility } from "../../context/VisibilityContext";
import axiosInstance from "../../axiosInstance";

interface ZoneMetrics {
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

interface ZoneData {
  _id: string;
  zoneName: string;
  zoneCode: string;
  status: string;
  cityId: string;
  countryId: string;
  stateId: string;
  assignedMFId?: {
    fname: string;
    lname: string;
    email: string;
  };
  areas?: Array<{
    _id: string;
    areaName: string;
    areaCode: string;
    status: string;
    areaFranchise?: {
      fname: string;
      lname: string;
      email: string;
    };
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

const DashboardZone: React.FC = () => {
  const user = React.useMemo(() => getUserFromLocalStorage(), []);
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneData, setZoneData] = useState<ZoneData | null>(null);
  const [metrics, setMetrics] = useState<ZoneMetrics | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const dataLoadedRef = useRef(false);

  useEffect(() => {
    setSidebarAndHeaderVisibility(true);
  }, [setSidebarAndHeaderVisibility]);

  const fetchZoneData = React.useCallback(async () => {
    if (!zoneId) {
      setError("Zone ID is required");
      setLoading(false);
      return;
    }

    const isInitialLoad = !dataLoadedRef.current;

    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      // Fetch zone details
      const zoneResponse = await axiosInstance.get(`/zones/${zoneId}`);
      const zone: ZoneData = zoneResponse.data.data;
      setZoneData(zone);

      console.log("📍 Zone Data:", zone);

      // Fetch zone metrics (BizWin, BizConnect, Meetups, etc.)
      const metricsResponse = await axiosInstance.get(
        `/franchise/mf/zone-metrics`,
        {
          params: {
            zoneId: zoneId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        }
      );

      console.log("📊 Zone Metrics Response:", metricsResponse.data);

      const metricsData: ZoneMetrics = metricsResponse.data.data.metrics;
      setMetrics(metricsData);

      dataLoadedRef.current = true;

      console.log("📊 Zone Metrics:", metricsData);
    } catch (err: any) {
      console.error("Error fetching zone data:", err);
      setError(
        err?.response?.data?.message ||
        "Failed to fetch zone data. Please try again."
      );
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [zoneId, dateRange]);

  useEffect(() => {
    fetchZoneData();
  }, [fetchZoneData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAreaClick = (areaId: string) => {
    navigate(`/dashboard-franchise/area/${areaId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  if (!zoneData || !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No data available for this zone.</Alert>
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
            Zone Dashboard - {zoneData.zoneName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            City: {zoneData.cityId || "N/A"} | Areas: {zoneData.areas?.length || 0} | Members: {metrics?.userCount || 0}
          </Typography>
        </Box>
      </Box>

      {/* Date Filter */}
      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
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
        </Stack>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} mt={2}>
        {/* M.U. - Meetups */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Groups />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {metrics?.meetups.total}
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
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Handshake />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {metrics?.bizConnectMeetups.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Given: {metrics?.bizConnectMeetups.given}</span>
                <span>Received: {metrics?.bizConnectMeetups.received}</span>
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
                {formatCurrency(metrics?.bizWinTransactions.totalAmount || 0)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Given: {formatCurrency(metrics?.bizWinTransactions.givenAmount || 0)}</span>
                <span>Received: {formatCurrency(metrics?.bizWinTransactions.receivedAmount || 0)}</span>
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
                {metrics?.visitorInvitations.total}
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

        {/* Member Referrals */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <People />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {metrics?.memberReferrals.total}
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
      </Grid>

      {/* Tabs for detailed views */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Zone Summary" />
          <Tab label="Areas List" />
        </Tabs>

        {/* Zone Summary Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Zone Information
                  </Typography>
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Zone Name:</Typography>
                      <Typography fontWeight="bold">{zoneData.zoneName}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Zone Code:</Typography>
                      <Typography fontWeight="bold">{zoneData.zoneCode}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>City:</Typography>
                      <Typography fontWeight="bold">{zoneData.cityId || "N/A"}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>State:</Typography>
                      <Typography fontWeight="bold">{zoneData.stateId || "N/A"}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Country:</Typography>
                      <Typography fontWeight="bold">{zoneData.countryId || "N/A"}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Status:</Typography>
                      <Chip
                        label={zoneData.status}
                        color={zoneData.status === "active" ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Total Areas:</Typography>
                      <Typography fontWeight="bold">{zoneData.areas?.length || 0}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Total Members:</Typography>
                      <Typography fontWeight="bold">{metrics?.userCount}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Master Franchise Partner
                  </Typography>
                  <Box mt={2}>
                    {zoneData.assignedMFId ? (
                      <>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ width: 48, height: 48 }}>
                            {zoneData.assignedMFId.fname?.[0] || "M"}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {zoneData.assignedMFId.fname} {zoneData.assignedMFId.lname}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Master Franchise Partner
                            </Typography>
                            {zoneData.assignedMFId.email && (
                              <Typography variant="body2" color="text.secondary">
                                {zoneData.assignedMFId.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Alert severity="info">No Master Franchise Partner assigned yet</Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Areas List Tab */}
        <TabPanel value={tabValue} index={1}>
          {zoneData.areas && zoneData.areas.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Area Name</strong></TableCell>
                    <TableCell><strong>Area Code</strong></TableCell>
                    <TableCell><strong>Area Franchise</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zoneData.areas.map((area) => (
                    <TableRow key={area._id} hover>
                      <TableCell>{area.areaName}</TableCell>
                      <TableCell>{area.areaCode}</TableCell>
                      <TableCell>
                        {area.areaFranchise ? (
                          <Typography variant="body2">{area.areaFranchise.email}</Typography>
                        ) : (
                          <Chip label="Not Assigned" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={area.status}
                          color={area.status === "active" ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAreaClick(area._id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No areas assigned to this zone yet</Alert>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default DashboardZone;

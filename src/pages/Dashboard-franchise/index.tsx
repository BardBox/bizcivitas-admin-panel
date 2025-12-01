import React, { useState } from "react";
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
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  Event,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";

// Mock data - will be replaced with real API calls
const mockPerformanceData = {
  zone: {
    name: "Mumbai Zone",
    totalAreas: 3,
    totalDCPs: 12,
    totalCoreGroups: 24,
    totalMembers: 450,
  },
  // Zone-level aggregated metrics
  overall: {
    meetups: { total: 145, offline: 98, digital: 47 },
    bizConnect: { total: 234, offline: 167, digital: 67 },
    bizWin: { total: 1850000, offline: 1320000, digital: 530000 },
    visitor: { total: 89, offline: 78, digital: 11 },
    events: { total: 56, offline: 34, digital: 22 },
  },
  // Area-wise data (each AF)
  areas: [
    {
      id: 1,
      name: "Andheri Area",
      afName: "Rajesh Kumar",
      dcps: 4,
      coreGroups: 8,
      members: 180,
      performanceScore: 92,
      trend: "up",
      metrics: {
        meetups: 58,
        bizConnect: 98,
        bizWin: 750000,
        visitor: 34,
        events: 22,
      },
      commission: 105000,
    },
    {
      id: 2,
      name: "Central Mumbai Area",
      afName: "Priya Sharma",
      dcps: 4,
      coreGroups: 8,
      members: 145,
      performanceScore: 88,
      trend: "up",
      metrics: {
        meetups: 45,
        bizConnect: 78,
        bizWin: 620000,
        visitor: 28,
        events: 18,
      },
      commission: 87000,
    },
    {
      id: 3,
      name: "Borivali Area",
      afName: "Amit Patel",
      dcps: 4,
      coreGroups: 8,
      members: 125,
      performanceScore: 85,
      trend: "stable",
      metrics: {
        meetups: 42,
        bizConnect: 58,
        bizWin: 480000,
        visitor: 27,
        events: 16,
      },
      commission: 67000,
    },
  ],
  monthlyTrend: {
    meetups: "+12%",
    bizConnect: "+18%",
    bizWin: "+25%",
    visitor: "+8%",
    events: "+15%",
  },
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

const DashboardFranchise: React.FC = () => {
  const user = getUserFromLocalStorage();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp color="success" />;
    if (trend === "down") return <TrendingDown color="error" />;
    return <Remove color="disabled" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.fname} {user?.lname}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Master Franchise Partner Dashboard - {mockPerformanceData.zone.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Areas: {mockPerformanceData.zone.totalAreas} | DCPs: {mockPerformanceData.zone.totalDCPs} | Core Groups:{" "}
        {mockPerformanceData.zone.totalCoreGroups} | Total Members: {mockPerformanceData.zone.totalMembers}
      </Typography>

      {/* Zone-Level Key Metrics Overview */}
      <Grid container spacing={3} mt={2}>
        {/* M.U. - Meetups */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Groups />
                <Chip label={mockPerformanceData.monthlyTrend.meetups} size="small" color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {mockPerformanceData.overall.meetups.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                M.U. (Meetups)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Offline: {mockPerformanceData.overall.meetups.offline}</span>
                <span>Digital: {mockPerformanceData.overall.meetups.digital}</span>
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
                <Chip label={mockPerformanceData.monthlyTrend.bizConnect} size="small" color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {mockPerformanceData.overall.bizConnect.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Offline: {mockPerformanceData.overall.bizConnect.offline}</span>
                <span>Digital: {mockPerformanceData.overall.bizConnect.digital}</span>
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
                <Chip label={mockPerformanceData.monthlyTrend.bizWin} size="small" color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(mockPerformanceData.overall.bizWin.total)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Offline: {formatCurrency(mockPerformanceData.overall.bizWin.offline)}</span>
                <span>Digital: {formatCurrency(mockPerformanceData.overall.bizWin.digital)}</span>
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
                <Chip label={mockPerformanceData.monthlyTrend.visitor} size="small" color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {mockPerformanceData.overall.visitor.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                VISITOR (Invitations)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Offline: {mockPerformanceData.overall.visitor.offline}</span>
                <span>Digital: {mockPerformanceData.overall.visitor.digital}</span>
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
                <Chip label={mockPerformanceData.monthlyTrend.events} size="small" color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {mockPerformanceData.overall.events.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                EVE (Events)
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between" sx={{ fontSize: "0.75rem" }}>
                <span>Offline: {mockPerformanceData.overall.events.offline}</span>
                <span>Digital: {mockPerformanceData.overall.events.digital}</span>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for detailed views */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Area Performance" />
          <Tab label="Area-wise BizWin" />
          <Tab label="Commission Details" />
        </Tabs>

        {/* Area Performance Tab */}
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
                {mockPerformanceData.areas.map((area) => (
                  <TableRow key={area.id} hover>
                    <TableCell><strong>{area.name}</strong></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>{area.afName[0]}</Avatar>
                        {area.afName}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{area.dcps}</TableCell>
                    <TableCell align="center">{area.coreGroups}</TableCell>
                    <TableCell align="center">{area.members}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: "100%", mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={area.performanceScore}
                            color={area.performanceScore > 85 ? "success" : "primary"}
                          />
                        </Box>
                        <Typography variant="body2">{area.performanceScore}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">{getTrendIcon(area.trend)}</TableCell>
                    <TableCell align="right">{formatCurrency(area.commission)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell colSpan={7} align="right"><strong>Total Commission:</strong></TableCell>
                  <TableCell align="right">
                    <strong>{formatCurrency(mockPerformanceData.areas.reduce((acc, a) => acc + a.commission, 0))}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Area-wise BizWin Tab */}
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
                {mockPerformanceData.areas.map((area) => (
                  <TableRow key={area.id} hover>
                    <TableCell><strong>{area.name}</strong></TableCell>
                    <TableCell align="center">
                      <Chip label={area.metrics.meetups} color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={area.metrics.bizConnect} color="secondary" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        {formatCurrency(area.metrics.bizWin)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={area.metrics.visitor} color="warning" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={area.metrics.events} color="info" />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><strong>Zone Total</strong></TableCell>
                  <TableCell align="center">
                    <Chip
                      label={mockPerformanceData.areas.reduce((acc, a) => acc + a.metrics.meetups, 0)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={mockPerformanceData.areas.reduce((acc, a) => acc + a.metrics.bizConnect, 0)}
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatCurrency(mockPerformanceData.areas.reduce((acc, a) => acc + a.metrics.bizWin, 0))}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={mockPerformanceData.areas.reduce((acc, a) => acc + a.metrics.visitor, 0)}
                      color="warning"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={mockPerformanceData.areas.reduce((acc, a) => acc + a.metrics.events, 0)}
                      color="info"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Commission Details Tab */}
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
                      {mockPerformanceData.areas.map((area) => (
                        <TableRow key={area.id}>
                          <TableCell>{area.name}</TableCell>
                          <TableCell align="right">{area.members}</TableCell>
                          <TableCell align="right">{formatCurrency(area.metrics.bizWin)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main" }}>
                            {formatCurrency(area.commission)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell><strong>Total</strong></TableCell>
                        <TableCell align="right"><strong>{mockPerformanceData.areas.reduce((acc, a) => acc + a.members, 0)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(mockPerformanceData.areas.reduce((acc, a) => acc + a.metrics.bizWin, 0))}</strong></TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main", fontSize: "1.1rem" }}>
                          {formatCurrency(mockPerformanceData.areas.reduce((acc, a) => acc + a.commission, 0))}
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
                    <Typography>Offline Members (12%):</Typography>
                    <Typography fontWeight="bold">{formatCurrency(158000)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>Digital Members (40%):</Typography>
                    <Typography fontWeight="bold">{formatCurrency(101000)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" sx={{ pt: 2, borderTop: "2px solid #e0e0e0" }}>
                    <Typography variant="h6">Total Commission:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(259000)}
                    </Typography>
                  </Box>
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
                    <Chip label={formatCurrency(65000)} color="warning" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>Completed Payouts:</Typography>
                    <Chip label={formatCurrency(194000)} color="success" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>Next Payout Date:</Typography>
                    <Typography fontWeight="bold">Dec 15, 2025</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default DashboardFranchise;

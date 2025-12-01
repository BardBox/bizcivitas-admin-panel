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
  AvatarGroup,
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
  People,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";

// Mock data - will be replaced with real API calls
const mockPerformanceData = {
  area: {
    name: "Andheri Area",
    zone: "Mumbai Zone",
    totalDCPs: 4,
    totalCoreGroups: 8,
    totalMembers: 180,
  },
  overall: {
    meetups: { total: 58, offline: 42, digital: 16 },
    bizConnect: { total: 98, offline: 71, digital: 27 },
    bizWin: { total: 750000, offline: 520000, digital: 230000 },
    visitor: { total: 34, offline: 29, digital: 5 },
    events: { total: 22, offline: 14, digital: 8 },
  },
  dcpGroups: [
    {
      id: 1,
      name: "DCP 1 - Tech & IT",
      leader: "Rajesh Kumar",
      coreGroups: 2,
      members: 48,
      performanceScore: 92,
      trend: "up",
      commission: 42000,
    },
    {
      id: 2,
      name: "DCP 2 - Finance & Banking",
      leader: "Priya Sharma",
      coreGroups: 2,
      members: 45,
      performanceScore: 88,
      trend: "up",
      commission: 38000,
    },
    {
      id: 3,
      name: "DCP 3 - Real Estate",
      leader: "Amit Patel",
      coreGroups: 2,
      members: 42,
      performanceScore: 85,
      trend: "stable",
      commission: 35000,
    },
    {
      id: 4,
      name: "DCP 4 - Healthcare",
      leader: "Dr. Sunita Reddy",
      coreGroups: 2,
      members: 45,
      performanceScore: 89,
      trend: "up",
      commission: 39000,
    },
  ],
  topPerformers: [
    { name: "Core Group Alpha", dcp: "DCP 1", score: 95, members: 24 },
    { name: "Core Group Beta", dcp: "DCP 2", score: 91, members: 22 },
    { name: "Core Group Gamma", dcp: "DCP 1", score: 89, members: 24 },
  ],
  monthlyTrend: {
    meetups: "+15%",
    bizConnect: "+22%",
    bizWin: "+28%",
    visitor: "+10%",
    events: "+18%",
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

const DashboardArea: React.FC = () => {
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
        Area Franchise Partner Dashboard - {mockPerformanceData.area.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Zone: {mockPerformanceData.area.zone} | DCPs: {mockPerformanceData.area.totalDCPs} | Core Groups:{" "}
        {mockPerformanceData.area.totalCoreGroups} | Members: {mockPerformanceData.area.totalMembers}
      </Typography>

      {/* Key Metrics Overview */}
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
          <Tab label="DCP Groups" />
          <Tab label="Top Performers" />
          <Tab label="Commission Details" />
        </Tabs>

        {/* DCP Groups Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>DCP Group</strong></TableCell>
                  <TableCell><strong>Leader</strong></TableCell>
                  <TableCell align="center"><strong>Core Groups</strong></TableCell>
                  <TableCell align="center"><strong>Members</strong></TableCell>
                  <TableCell align="center"><strong>Performance Score</strong></TableCell>
                  <TableCell align="center"><strong>Trend</strong></TableCell>
                  <TableCell align="right"><strong>Commission</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPerformanceData.dcpGroups.map((dcp) => (
                  <TableRow key={dcp.id} hover>
                    <TableCell>{dcp.name}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>{dcp.leader[0]}</Avatar>
                        {dcp.leader}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{dcp.coreGroups}</TableCell>
                    <TableCell align="center">{dcp.members}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: "100%", mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={dcp.performanceScore}
                            color={dcp.performanceScore > 85 ? "success" : "primary"}
                          />
                        </Box>
                        <Typography variant="body2">{dcp.performanceScore}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">{getTrendIcon(dcp.trend)}</TableCell>
                    <TableCell align="right">{formatCurrency(dcp.commission)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell colSpan={6} align="right"><strong>Total Commission:</strong></TableCell>
                  <TableCell align="right">
                    <strong>{formatCurrency(mockPerformanceData.dcpGroups.reduce((acc, d) => acc + d.commission, 0))}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Top Performers Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {mockPerformanceData.topPerformers.map((performer, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip
                        label={`#${index + 1}`}
                        color={index === 0 ? "success" : index === 1 ? "primary" : "default"}
                        size="small"
                      />
                      <Typography variant="h5" fontWeight="bold">
                        {performer.score}%
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {performer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Under: {performer.dcp}
                    </Typography>
                    <Box mt={2}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <People fontSize="small" />
                        <Typography variant="body2">
                          Members: <strong>{performer.members}</strong>
                        </Typography>
                      </Box>
                      <AvatarGroup max={4}>
                        <Avatar sx={{ width: 28, height: 28 }}>A</Avatar>
                        <Avatar sx={{ width: 28, height: 28 }}>B</Avatar>
                        <Avatar sx={{ width: 28, height: 28 }}>C</Avatar>
                        <Avatar sx={{ width: 28, height: 28 }}>D</Avatar>
                      </AvatarGroup>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Commission Details Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Commission Breakdown
                  </Typography>
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Offline Members (7%):</Typography>
                      <Typography fontWeight="bold">{formatCurrency(95000)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Digital Members (30%):</Typography>
                      <Typography fontWeight="bold">{formatCurrency(59000)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" sx={{ pt: 2, borderTop: "2px solid #e0e0e0" }}>
                      <Typography variant="h6">Total Commission:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(154000)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payout Status
                  </Typography>
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Pending Payouts:</Typography>
                      <Chip label={formatCurrency(32000)} color="warning" />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Completed Payouts:</Typography>
                      <Chip label={formatCurrency(122000)} color="success" />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography>Next Payout Date:</Typography>
                      <Typography fontWeight="bold">Dec 15, 2025</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default DashboardArea;

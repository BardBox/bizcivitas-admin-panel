import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import {
  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  Event,
  Star,
  TrendingUp,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";

// Mock data - will be replaced with real API calls
const mockPerformanceData = {
  cgc: {
    name: "Core Group Alpha",
    dcp: "DCP 1 - Tech & IT",
    area: "Andheri Area",
    zone: "Mumbai Zone",
    totalMembers: 24,
    performanceScore: 95,
  },
  overall: {
    meetups: 28,
    bizConnect: 56,
    bizWin: 425000,
    visitor: 18,
    events: 12,
  },
  coreMembers: [
    {
      id: 1,
      name: "Amit Kulkarni",
      businessCategory: "Manufacturing",
      performanceScore: 98,
      memberType: "Flagship",
      avatar: "A",
    },
    {
      id: 2,
      name: "Meera Joshi",
      businessCategory: "Retail",
      performanceScore: 96,
      memberType: "Flagship",
      avatar: "M",
    },
    {
      id: 3,
      name: "Suresh Nair",
      businessCategory: "Construction",
      performanceScore: 94,
      memberType: "Flagship",
      avatar: "S",
    },
    {
      id: 4,
      name: "Pooja Deshmukh",
      businessCategory: "Import/Export",
      performanceScore: 92,
      memberType: "Flagship",
      avatar: "P",
    },
    {
      id: 5,
      name: "Rajiv Malhotra",
      businessCategory: "Logistics",
      performanceScore: 90,
      memberType: "Flagship",
      avatar: "R",
    },
  ],
  digitalMembers: [
    {
      id: 6,
      name: "Neha Shah",
      businessCategory: "Digital Marketing",
      performanceScore: 88,
      avatar: "N",
    },
    {
      id: 7,
      name: "Karan Mehta",
      businessCategory: "Software Dev",
      performanceScore: 85,
      avatar: "K",
    },
  ],
  recentAchievements: [
    {
      title: "Top Performing Group",
      description: "Highest BizWin this month",
      date: "Dec 1",
    },
    {
      title: "100% Meeting Attendance",
      description: "All members attended weekly meetup",
      date: "Nov 28",
    },
    {
      title: "New Member Milestone",
      description: "Welcomed 3 new flagship members",
      date: "Nov 25",
    },
  ],
  upcomingEvents: [
    {
      title: "Weekly Group Meeting",
      date: "Dec 10, 2025",
      time: "10:00 AM",
      type: "Meetup",
    },
    {
      title: "Business Networking Event",
      date: "Dec 15, 2025",
      time: "6:00 PM",
      type: "Event",
    },
    {
      title: "Visitor Session",
      date: "Dec 12, 2025",
      time: "11:00 AM",
      type: "Visitor",
    },
  ],
};

const DashboardCGC: React.FC = () => {
  const user = getUserFromLocalStorage();

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
        CGC Dashboard - {mockPerformanceData.cgc.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Under: {mockPerformanceData.cgc.dcp} | Area:{" "}
        {mockPerformanceData.cgc.area} | Zone: {mockPerformanceData.cgc.zone} |
        Members: {mockPerformanceData.cgc.totalMembers} | Performance Score:{" "}
        {mockPerformanceData.cgc.performanceScore}%
      </Typography>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} mt={2}>
        {/* M.U. - Meetups */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Groups fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.meetups}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                M.U. (Meetups)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Offline Events</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.C. - BizConnect */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Handshake fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.bizConnect}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Referrals Exchange</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.W. - BizWin */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <EmojiEvents fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(mockPerformanceData.overall.bizWin)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Business Generated</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* VISITOR - Invitations */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Visibility fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.visitor}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                VISITOR (Invitations)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">New Prospects</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* EVE - Events */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Event fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.events}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                EVE (Events)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Group Events</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Members & Activities Section */}
      <Grid container spacing={3} mt={2}>
        {/* Flagship Core Members */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Flagship Core Members</Typography>
              <Chip
                label={mockPerformanceData.coreMembers.length}
                color="primary"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {mockPerformanceData.coreMembers.map((member) => (
                <ListItem
                  key={member.id}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    mb: 1,
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#f093fb" }}>{member.avatar}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {member.name}
                        </Typography>
                        <Chip
                          label={`${member.performanceScore}%`}
                          size="small"
                          color="success"
                        />
                        <Chip
                          label={member.memberType}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {member.businessCategory}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Digital Members & Activities */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            {/* Digital Members */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">Digital Members (DM)</Typography>
                  <Chip
                    label={mockPerformanceData.digitalMembers.length}
                    color="secondary"
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {mockPerformanceData.digitalMembers.map((member) => (
                    <ListItem
                      key={member.id}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                        mb: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#4facfe" }}>
                          {member.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {member.name}
                            </Typography>
                            <Chip
                              label={`${member.performanceScore}%`}
                              size="small"
                              color="info"
                            />
                          </Box>
                        }
                        secondary={member.businessCategory}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Recent Achievements */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Star color="warning" />
                    Recent Achievements
                  </Box>
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {mockPerformanceData.recentAchievements.map(
                    (achievement, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              color="primary"
                            >
                              {achievement.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {achievement.description}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {achievement.date}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    )
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Events
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {mockPerformanceData.upcomingEvents.map((event, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="start"
                        mb={1}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {event.title}
                        </Typography>
                        <Chip label={event.type} size="small" color="primary" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {event.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.time}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardCGC;

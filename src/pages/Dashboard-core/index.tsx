import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";

import Incrementalcore from "../../component/incremenral-core";

import { getUserFromLocalStorage } from "../../api/auth";
import api from "../../api/api";

interface DashboardStats {
  totalReferBy: number;
  totalConnections: number;
  communities: number;
}



interface CommunityData {
  _id: string;
  name: string;
}

const DashboardCore: React.FC = () => {
  const user = getUserFromLocalStorage();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [communities, setCommunities] = useState<CommunityData[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats (referrals, connections, communities)
        const statsResponse = await api.get("/core-members/dashboard");
        if (statsResponse.data.success) {
          setDashboardStats(statsResponse.data.data);
        }



        // Fetch communities
        const communitiesResponse = await api.get("/core-members/getAllCommunitiesOfCoreMember");
        if (communitiesResponse.data.success) {
          setCommunities(communitiesResponse.data.data);
        }

      } catch (error: any) {
        console.error("Error fetching dashboard data:", error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);



  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.fname} {user?.lname}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Core Member Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Communities: {communities.length} | Total Connections: {dashboardStats?.totalConnections || 0} | Total Referrals: {dashboardStats?.totalReferBy || 0}
      </Typography>

      {/* Performance Metrics Cards */}


      {/* Existing Dashboard Components */}
      <Box mt={4}>
        <Incrementalcore />
      </Box>

      {/* <Grid container spacing={3} mt={3} sx={{ height: "70vh" }}>
        <RevenueComponentCore />
      </Grid> */}

    </Box>
  );
};

export default DashboardCore;

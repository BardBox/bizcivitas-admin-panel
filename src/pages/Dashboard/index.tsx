import React from "react";
import { Box, Grid } from "@mui/material";
import GraphComponent from "../../component/eventgraph";
import RevenueComponent from "../../component/RevenueComponent";
import Incremental from "../../component/incremental";
import UserTable from "../../component/user-table";
import CoreMemberTable from "../../component/coremember-table";


const Dashboard: React.FC = () => {
  return (
    <Box sx={{ padding: 0, margin: 0 }}>
    <Incremental />
    <Grid container spacing={1} sx={{ mt: 0 }}>
      <Grid item xs={12}>
        <GraphComponent />
      </Grid>
      <Grid item xs={12}>
        <RevenueComponent />
      </Grid>
    </Grid>
    <Grid container spacing={1} sx={{ mt: 0 }}>
      <Grid item xs={12} md={6}>
        <UserTable />
      </Grid>
      <Grid item xs={12} md={6}>
        <CoreMemberTable />
      </Grid>
    </Grid>
    {/* <Box sx={{ mt: 0 }}>
      <UpcomingEvents />
    </Box> */}
  </Box>


  );
};

export default Dashboard;
import React from "react";
import { Box, Grid } from "@mui/material";
import Incrementalcore from "../../component/incremenral-core";
import RevenueComponentCore from "../../component/RevenueComponentCore";
// import UserTable from "../../component/user-table-core";// import CoreMemberTable from "../../component/coremember-table";

// Define the type for a member
// 




// // Static sample data
// const staticMembers: Member[] = [
//   { id: 1, name: "John Doe", role: "Admin" },
//   { id: 2, name: "Jane Smith", role: "Editor" },
//   { id: 3, name: "Michael Johnson", role: "Viewer" },
// ];

const DashboardCore: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* ✅ Dashboard Components */}

      <Incrementalcore  />

      {/* <Incrementalcore count={staticMembers.length} /> */}

      <Grid container spacing={3} mt={3} sx={{ height: "70vh" }} >
        
          <RevenueComponentCore />
      </Grid>

    
        {/* <Grid >
          <UserTable />
        </Grid>
     
        */}
    
    </Box>
  );
};

export default DashboardCore;

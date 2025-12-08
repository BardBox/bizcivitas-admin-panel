import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import DashboardCore from "./pages/Dashboard-core";
import DashboardFranchise from "./pages/Dashboard-franchise";
import DashboardZone from "./pages/Dashboard-zone";
import DashboardArea from "./pages/Dashboard-area";
import DashboardCGC from "./pages/Dashboard-cgc";
import DashboardDCP from "./pages/Dashboard-dcp";
import AdminAnalytics from "./pages/AdminAnalytics";
import BizWinAnalytics from "./pages/BizWinAnalytics";
import BizConnectAnalytics from "./pages/BizConnectAnalytics";
import ReferralAnalytics from "./pages/ReferralAnalytics";
import ComprehensiveDashboard from "./pages/ComprehensiveDashboard";
import { useLoadingContext } from "./context/loading";
import Loader from "./component/Loader";
import PublicRoute from "./component/PublicRoute";
import PrivateRoute from "./component/PrivateRoute";
import RoleBasedRoute from "./component/RoleBasedRoute";
import SignIn from "./pages/Auth/SignIn";
import FranchiseSignIn from "./pages/Auth/FranchiseSignIn";
import SignUp from "./pages/Auth/SignUp";
import GuestList from "./pages/GuestList/guest";
import CustomersPage from "./pages/user/user";
import AddUserPage from "./pages/user/AddUser";
import CreateFranchise from "./pages/user/CreateFranchise";
// import EventCreation from "./pages/EventCreation/eventCreation";
import CommunityMemberList from "./pages/core";
import CommunityPage from "./pages/community";
import CommunityMembersPage from "./pages/community-members-page";
import OneDayEvent from "./component/one-day";
import Trips from "./component/trip-events";
import OnlineEvents from "./component/online-events";
import AllEventsLayout from "./pages/AllEvents/page";
import "react-toastify/dist/ReactToastify.css";
import CommunityCore from "./pages/community-core";
import ReferredUsers from "./pages/user-core";
import UserDetailsPage from "./pages/UserDetailPage";
import RegionManagement from "./pages/region";
import CreateBlog from "./pages/CreateBlog";
import ViewBlog from "./pages/ViewBlog";
import EditBlog from "./pages/EditBlog";
import EventMembers from "./pages/Eventmembers";
import MeetingPage from "./pages/MeetingPage/page";
import AnnouncementPage from "./pages/Wallfeed";
import ReportPostPage from "./pages/Report-post";
import UserPayment from "./pages/User-payment/User-payment";
import Inquiry from "./pages/Inquiry/inquiry";
import MembershipType from "./pages/MembershipBenefits/memberbenefits";
import MeetingDetailsPage from "./pages/MeetingDetailpage";
import Upload from "./pages/upload/upload";
import ManualPaymentForm from "./pages/Mannual-payment/Mannual-payment";
import JoinRequests from "./pages/EventRequest";
import DailyFeed from "./pages/Dailyfeed"
import ZoneList from "./pages/Hierarchy/ZoneList";
import AreaList from "./pages/Hierarchy/AreaList";
import ZoneDetails from "./pages/Hierarchy/ZoneDetails";
import FranchiseManagement from "./pages/Hierarchy/FranchiseManagement";
import CommissionDashboard from "./pages/Finance/CommissionDashboard";
import CommissionSettings from "./pages/Finance/CommissionSettings";
import CommissionCalculator from "./pages/Finance/CommissionCalculator";
import RoleManagement from "./pages/RBAC/RoleManagement";

function App() {
  const { isLoading } = useLoadingContext();

  return (
    <>
      <Loader loading={isLoading} />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<SignIn />} />
          <Route path="/franchise-login" element={<FranchiseSignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Private Routes (Only Logged-In Users) */}
        <Route element={<PrivateRoute />}>
          <Route path="/AllEvents" element={<AllEventsLayout />}>
            <Route index element={<Navigate to="one-day" />} />
            <Route path="one-day" element={<OneDayEvent />} />
            <Route path="trip-events" element={<Trips />} />
            <Route path="online-events" element={<OnlineEvents />} />
          </Route>
        </Route>

        {/* Admin-Only Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/comprehensive-dashboard" element={<ComprehensiveDashboard />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
          <Route path="/bizwin-analytics" element={<BizWinAnalytics />} />
          <Route path="/bizconnect-analytics" element={<BizConnectAnalytics />} />
          <Route path="/referral-analytics" element={<ReferralAnalytics />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community-members/:communityId" element={<CommunityMembersPage />} />
          <Route path="/user/:userId" element={<UserDetailsPage />} /> {/* ✅ Add this */}

          <Route path="/GuestList" element={<GuestList />} />
          <Route path="/user" element={<CustomersPage />} />
          <Route path="/add-user" element={<AddUserPage />} />
          <Route path="/create-franchise" element={<CreateFranchise />} />
          <Route path="/Inquiry" element={<Inquiry />} />
          <Route path="/core" element={<CommunityMemberList />} />
          {/* <Route path="/EventCreation" element={<EventCreation />} /> */}
          <Route path="/region" element={<RegionManagement />} />
          <Route path="/Meetingpage" element={<MeetingPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailsPage />} />

          <Route path="/create-blog" element={<CreateBlog />} />
          <Route path="/view-blog/:id" element={<ViewBlog />} />
          <Route path="/edit-blog/:id" element={<EditBlog />} />
          <Route path="/eventmembers/:eventId" element={<EventMembers />} />
          <Route path="/Wallfeed" element={<AnnouncementPage />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/report-post" element={<ReportPostPage />} />
          <Route path="/user-payment" element={<UserPayment />} />
          <Route path="/memberships" element={<MembershipType />} />
          <Route path="/Mannual-payment" element={<ManualPaymentForm />} />
          <Route path="/join-request/:eventId" element={<JoinRequests />} />
          <Route path="/dailyfeed" element={<DailyFeed />} />

          {/* New Hierarchy & Finance Routes */}
          <Route path="/hierarchy/zones" element={<ZoneList />} />
          <Route path="/hierarchy/zones/:id" element={<ZoneDetails />} />
          <Route path="/finance/commissions" element={<CommissionDashboard />} />
          <Route path="/finance/commission-settings" element={<CommissionSettings />} />
          <Route path="/finance/commission-calculator" element={<CommissionCalculator />} />
          <Route path="/rbac/roles" element={<RoleManagement />} />
        </Route>

        {/* Admin & Master Franchise Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["admin", "master-franchise"]} />}>
          <Route path="/hierarchy/areas" element={<AreaList />} />
          <Route path="/hierarchy/franchise-partners" element={<FranchiseManagement />} />
        </Route>

        {/* Core-Member and Admin Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["admin", "core-member"]} />}>
          <Route path="/dashboard-core" element={<DashboardCore />} />
          <Route path="/community-core" element={<CommunityCore />} />
          <Route path="/user-core" element={<ReferredUsers />} />
          <Route path="/community-members/:communityId" element={<CommunityMembersPage />} />

          <Route path="/user/:userId" element={<UserDetailsPage />} /> {/* ✅ Add this */}

        </Route>

        {/* Master Franchise and Admin - Franchise Dashboard Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["admin", "master-franchise"]} />}>
          <Route path="/dashboard-franchise" element={<DashboardFranchise />} />
          <Route path="/dashboard-franchise/zone/:zoneId" element={<DashboardZone />} />
          <Route path="/dashboard-franchise/area/:areaId" element={<DashboardArea />} />
        </Route>

        {/* Area Franchise Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["area-franchise"]} />}>
          <Route path="/dashboard-area" element={<DashboardArea />} />
        </Route>

        {/* CGC Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["cgc"]} />}>
          <Route path="/dashboard-cgc" element={<DashboardCGC />} />
        </Route>

        {/* DCP Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["dcp"]} />}>
          <Route path="/dashboard-dcp" element={<DashboardDCP />} />
        </Route>

        {/* Redirect Root URL to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Catch-All Route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;

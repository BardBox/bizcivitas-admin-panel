import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import DashboardCore from "./pages/Dashboard-core";
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
import SignUp from "./pages/Auth/SignUp";
import GuestList from "./pages/GuestList/guest";
import CustomersPage from "./pages/user/user";
import AddUserPage from "./pages/user/AddUser";
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

function App() {
  const { isLoading } = useLoadingContext();

  return (
    <>
      <Loader loading={isLoading} />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Private Routes (Only Logged-In Users) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        
          <Route path="/AllEvents" element={<AllEventsLayout />}>
            <Route index element={<Navigate to="one-day" />} />
            <Route path="one-day" element={<OneDayEvent />} />
            <Route path="trip-events" element={<Trips />} />
            <Route path="online-events" element={<OnlineEvents />} />
          </Route>
        </Route>

        {/* Admin-Only Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
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
             <Route path="/Inquiry" element={<Inquiry/>} />
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
 </Route>

        {/* Core-Member and Admin Routes */}
        <Route element={<RoleBasedRoute allowedRoles={["admin", "core-member"]} />}>
          <Route path="/dashboard-core" element={<DashboardCore />} />
          <Route path="/community-core" element={<CommunityCore />} />
          <Route path="/user-core" element={<ReferredUsers />} />
          <Route path="/community-members/:communityId" element={<CommunityMembersPage />} />

          <Route path="/user/:userId" element={<UserDetailsPage />} /> {/* ✅ Add this */}

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

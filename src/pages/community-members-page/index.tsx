import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AxiosError } from "axios";
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import { Search, ArrowBack } from "@mui/icons-material";
import { debounce } from "lodash";

interface Member {
  userId: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  membershipType: string;
  companyName: string;
  industry: string;
  city: string | null;
}

interface Community {
  _id: string;
  communityName: string;
  region: string;
  image?: string;
}

const CommunityMembersPage: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Member[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchUsersKeyword, setSearchUsersKeyword] = useState("");

  const fetchMembers = async () => {
    if (!communityId) return;
    setLoading(true);
    try {
      const response = await api.get(`/community/${communityId}`);
      const membersData = response.data.data.map((user: any) => ({
        userId: user.id || "Unknown",
        name: `${user.fname || ""} ${user.lname || ""}`.trim() || "Unknown",
        email: user.email || "N/A",
        mobile: user.contactNo ? String(user.contactNo) : "N/A",
        role: user.role || "N/A",
        membershipType: user.classification || "N/A",
        companyName: user.companyName || "N/A",
        industry: user.industry || "N/A",
        city: user.city || "N/A",
      }));
      setMembers(membersData);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Failed to fetch community members.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users/getallusers");
      let usersData: Member[] = [];
      if (response.data.data.users) {
        usersData = response.data.data.users.map((item: any) => item.user).map((user: any) => ({
          userId: user.userId || "Unknown",
          name: user.name || "Unknown",
          email: user.email || "N/A",
          mobile: user.mobile ? String(user.mobile) : "N/A",
          role: user.role || "N/A",
          membershipType: user.membershipType || "N/A",
          companyName: user.companyName || "N/A",
          industry: user.industry || "N/A",
          city: user.city || "N/A",
        }));
      } else if (Array.isArray(response.data.data)) {
        usersData = response.data.data.map((user: any) => ({
          userId: user.id || "Unknown",
          name: `${user.fname || ""} ${user.lname || ""}`.trim() || "Unknown",
          email: user.email || "N/A",
          mobile: user.contactNo ? String(user.contactNo) : "N/A",
          role: user.role || "N/A",
          membershipType: user.classification || "N/A",
          companyName: user.companyName || "N/A",
          industry: user.industry || "N/A",
          city: user.city || "N/A",
        }));
      }
      setAllUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const response = await api.get("/community");
      setCommunities(response.data.data || []);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Failed to fetch communities.");
    }
  };

  const searchMembers = debounce(async () => {
    if (!communityId || !searchKeyword) {
      fetchMembers();
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/community/${communityId}/search?keyword=${encodeURIComponent(searchKeyword)}`);
      const membersData = response.data.data.map((user: any) => ({
        userId: user.id || "Unknown",
        name: `${user.fname || ""} ${user.lname || ""}`.trim() || "Unknown",
        email: user.email || "N/A",
        mobile: user.contactNo ? String(user.contactNo) : "N/A",
        role: user.role || "N/A",
        membershipType: user.classification || "N/A",
        companyName: user.companyName || "N/A",
        industry: user.industry || "N/A",
        city: user.city || "N/A",
      }));
      setMembers(membersData);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Failed to search members.");
    } finally {
      setLoading(false);
    }
  }, 300);

  const searchAllUsers = debounce(() => {
    if (!searchUsersKeyword) {
      setFilteredUsers(allUsers);
      return;
    }
    const lowerKeyword = searchUsersKeyword.toLowerCase();
    const filtered = allUsers.filter((user) =>
      Object.values(user).some((field) => String(field).toLowerCase().includes(lowerKeyword))
    );
    setFilteredUsers(filtered);
  }, 300);

  const assignUser = async (userId: string) => {
    if (!communityId || !userId) {
      toast.error("Community ID or User ID is missing.");
      return;
    }
    setActionLoading(userId);
    try {
      await api.post("/community/user/assign", { communityId, userId });
      toast.success("User assigned successfully.");
      await Promise.all([fetchMembers(), fetchAllUsers()]);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Failed to assign user.");
    } finally {
      setActionLoading(null);
    }
  };

  const removeUser = async (userId: string) => {
    if (!communityId || !userId) {
      toast.error("Community ID or User ID is missing.");
      return;
    }
    setActionLoading(userId);
    try {
      await api.post("/community/user/remove", { communityId, userId });
      toast.success("User removed successfully.");
      await Promise.all([fetchMembers(), fetchAllUsers()]);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Failed to remove user.");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    fetchMembers();
    fetchCommunities();
  }, [communityId]);

  useEffect(() => {
    searchMembers();
    return () => searchMembers.cancel();
  }, [searchKeyword]);

  useEffect(() => {
    searchAllUsers();
    return () => searchAllUsers.cancel();
  }, [searchUsersKeyword, allUsers]);

  return (
    <Box sx={{ p: 3 }}>
      <ToastContainer position="top-center" autoClose={3000} />
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5">
          {communities.find((c) => c._id === communityId)?.communityName || "Community Members"}
        </Typography>
      </Box>
      <Tabs value={tabValue} onChange={(_: React.SyntheticEvent, newValue: number) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Community Members" />
        <Tab label="All Users" />
      </Tabs>
      {tabValue === 0 ? (
        <Box>
          <TextField
            label="Search Members"
            variant="outlined"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{ endAdornment: <Search /> }}
          />
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : members.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e0e0e0" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Contact No.</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Membership Type</TableCell>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Industry</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow
                      key={member.userId}
                      hover
                      onClick={() => navigate(`/user/${member.userId}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.mobile}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.membershipType}</TableCell>
                      <TableCell>{member.companyName}</TableCell>
                      <TableCell>{member.industry}</TableCell>
                      <TableCell>{member.city}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUser(member.userId);
                          }}
                          disabled={actionLoading === member.userId}
                          startIcon={actionLoading === member.userId ? <CircularProgress size={16} /> : null}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography textAlign="center" color="textSecondary">
              No members found.
            </Typography>
          )}
        </Box>
      ) : (
        <Box>
          <TextField
            label="Search Users"
            variant="outlined"
            value={searchUsersKeyword}
            onChange={(e) => setSearchUsersKeyword(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{ endAdornment: <Search /> }}
          />
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : filteredUsers.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e0e0e0" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Contact No.</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Membership Type</TableCell>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Industry</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.userId}
                      hover
                      onClick={() => navigate(`/user/${user.userId}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.mobile}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.membershipType}</TableCell>
                      <TableCell>{user.companyName}</TableCell>
                      <TableCell>{user.industry}</TableCell>
                      <TableCell>{user.city}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            assignUser(user.userId);
                          }}
                          disabled={members.some((m) => m.userId === user.userId) || actionLoading === user.userId}
                          startIcon={actionLoading === user.userId ? <CircularProgress size={16} /> : null}
                        >
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography textAlign="center" color="textSecondary">
              No users found.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CommunityMembersPage;

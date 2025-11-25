import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Box,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { format } from "date-fns";
import api from "../../api/api"; // Import API instance
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Interfaces
interface PaymentVerification {
  feeType: string;
  amount: number;
  status: string;
  transactionId?: string;
  date?: string;
  paymentMethod?: string;
  cashId?: string;
  checkId?: string;
}

interface PaymentSummary {
  totalFees: number;
  totalAmount: number;
  completedFees: number;
  pendingFees: number;
  completedAmount: number;
  pendingAmount: number;
}

interface UserWithPayments {
  _id: string;
  fname: string | null; // Allow null to reflect possible API response
  lname: string | null; // Allow null to reflect possible API response
  email: string;
  mobile: string;
  membershipType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  paymentVerification: PaymentVerification[];
  paymentSummary: PaymentSummary;
}

const UserPayment: React.FC = () => {
  const [users, setUsers] = useState<UserWithPayments[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPayments[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openRows, setOpenRows] = useState<{ [key: string]: boolean }>({});
  // Filter states
  const [nameFilter, setNameFilter] = useState<string>("");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [membershipFilter, setMembershipFilter] = useState<string>("All");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("All");

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  // Fetch payment details from API
  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/admin/fees-payments");
      const fetchedUsers: UserWithPayments[] = response.data.data.users;

      // Log users with missing fname or lname
      fetchedUsers.forEach((user, index) => {
        if (!user.fname || !user.lname) {
          console.warn(`User at index ${index} has missing fname or lname:`, user);
        }
      });

      // Sanitize data to ensure fname and lname are strings
      const sanitizedUsers = fetchedUsers.map((user) => ({
        ...user,
        fname: user.fname ?? "Unknown",
        lname: user.lname ?? "Unknown",
      }));

      setUsers(sanitizedUsers);
      setFilteredUsers(sanitizedUsers);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load payment details."
      );
      toast.error("Failed to load payment details", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever filter states or users change
  useEffect(() => {
    let filtered = [...users];

    // Filter by name
    if (nameFilter) {
      filtered = filtered.filter((user) =>
        (user.fname ?? "").toLowerCase().includes(nameFilter.toLowerCase()) ||
        (user.lname ?? "").toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Filter by email
    if (emailFilter) {
      filtered = filtered.filter((user) =>
        (user.email ?? "").toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    // Filter by membership type
    if (membershipFilter !== "All") {
      filtered = filtered.filter(
        (user) => user.membershipType === membershipFilter
      );
    }

    // Filter by active status
    if (activeFilter !== "All") {
      filtered = filtered.filter((user) =>
        activeFilter === "Active" ? user.isActive : !user.isActive
      );
    }

    // Filter by payment status
    if (paymentStatusFilter !== "All") {
      filtered = filtered.filter((user) =>
        paymentStatusFilter === "Completed"
          ? user.paymentSummary.pendingAmount === 0
          : user.paymentSummary.pendingAmount > 0
      );
    }

    setFilteredUsers(filtered);
  }, [
    nameFilter,
    emailFilter,
    membershipFilter,
    activeFilter,
    paymentStatusFilter,
    users,
  ]);

  // Toggle row expansion
  const handleToggleRow = (userId: string) => {
    setOpenRows((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Get unique membership types for dropdown
  const membershipTypes = [
    "All",
    ...new Set(users.map((user) => user.membershipType)),
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Payment Details
      </Typography>

      {/* Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search by Name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search by Email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Membership Type</InputLabel>
              <Select
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value)}
                label="Membership Type"
              >
                {membershipTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Active Status</InputLabel>
              <Select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                label="Active Status"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                label="Payment Status"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && filteredUsers.length === 0 && (
        <Typography variant="body1" color="text.secondary" align="center">
          No users found.
        </Typography>
      )}

      {/* Data Table */}
      {!loading && !error && filteredUsers.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Membership</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Completed Amount</TableCell>
                <TableCell>Pending Amount</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <React.Fragment key={user._id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleRow(user._id)}
                      >
                        {openRows[user._id] ? (
                          <KeyboardArrowUp />
                        ) : (
                          <KeyboardArrowDown />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>{`${user.fname ?? "Unknown"} ${user.lname ?? "Unknown"}`}</TableCell>
                    <TableCell>{user.email ?? "N/A"}</TableCell>
                    <TableCell>{user.mobile ?? "N/A"}</TableCell>
                    <TableCell>{user.membershipType ?? "N/A"}</TableCell>
                    <TableCell>{user.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      ₹{user.paymentSummary.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ₹{user.paymentSummary.completedAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ₹{user.paymentSummary.pendingAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={10}
                    >
                      <Collapse
                        in={openRows[user._id]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ margin: 1 }}>
                          {/* Payment Verification */}
                          <Typography variant="h6" gutterBottom>
                            Payment Details
                          </Typography>
                          {user.paymentVerification &&
                          user.paymentVerification.length > 0 ? (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Fee Type</TableCell>
                                  <TableCell>Amount</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Payment Method</TableCell>
                                  <TableCell>Razorpay Payment ID</TableCell>
                                  <TableCell>Created At</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {user.paymentVerification.map(
                                  (payment, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{payment.feeType ?? "N/A"}</TableCell>
                                      <TableCell>
                                        ₹{payment.amount.toLocaleString()}
                                      </TableCell>
                                      <TableCell>{payment.status ?? "N/A"}</TableCell>
                                      <TableCell>
                                        {payment.paymentMethod ?? "N/A"}
                                      </TableCell>
                                      <TableCell>
                                        {payment.transactionId ?? "N/A"}
                                      </TableCell>
                                      <TableCell>
                                        {payment.date
                                          ? format(
                                              new Date(payment.date),
                                              "dd MMM yyyy"
                                            )
                                          : "N/A"}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No payment details available.
                            </Typography>
                          )}

                          {/* Payment Summary */}
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Payment Summary
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2">
                              Total Fees: {user.paymentSummary.totalFees}
                            </Typography>
                            <Typography variant="body2">
                              Total Amount: ₹
                              {user.paymentSummary.totalAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              Completed Fees:{" "}
                              {user.paymentSummary.completedFees}
                            </Typography>
                            <Typography variant="body2">
                              Completed Amount: ₹
                              {user.paymentSummary.completedAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              Pending Fees: {user.paymentSummary.pendingFees}
                            </Typography>
                            <Typography variant="body2">
                              Pending Amount: ₹
                              {user.paymentSummary.pendingAmount.toLocaleString()}
                            </Typography>
                            {user.paymentVerification.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  Payment Methods & IDs:
                                </Typography>
                                {user.paymentVerification.map(
                                  (payment, index) => (
                                    <Typography
                                      key={index}
                                      variant="body2"
                                      sx={{ pl: 1 }}
                                    >
                                      • {payment.feeType ?? "N/A"} ({payment.status ?? "N/A"}):{" "}
                                      {payment.paymentMethod ?? "N/A"}{" "}
                                      {payment.paymentMethod === "cash" &&
                                        payment.cashId && (
                                          <span>
                                            (Cash ID: {payment.cashId})
                                          </span>
                                        )}
                                      {payment.paymentMethod === "check" &&
                                        payment.checkId && (
                                          <span>
                                            (Check ID: {payment.checkId})
                                          </span>
                                        )}
                                    </Typography>
                                  )
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Container>
  );
};

export default UserPayment;
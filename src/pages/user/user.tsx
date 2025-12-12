import React, { useEffect, useState, useMemo } from "react";
import { Edit, Trash2 } from 'lucide-react';
import api from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useVisibility } from "../../context/VisibilityContext";
import { CSVLink } from "react-csv";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  TableSortLabel,
  Select,
  MenuItem,
  FormControl,
  Box
} from "@mui/material";
import TwoFactorVerifyModal from "../../component/TwoFactorVerifyModal"; // ✅ Import 2FA Modal

// Define roles and membership types
// ✅ UPDATED RBAC ROLES - Matches backend constants
const roles = [
  "user",                    // Default role for all registered users
  "digital-member",          // Digital-only participants
  "core-member",             // Non-leader group members
  "pioneer",                 // Special recognition role (optional)
  "dcp",                     // Digital Channel Partner (manages digital members)
  "cgc",                     // Core Group Council (group leaders, can create groups)
  "area-franchise",          // Area Partner (manages areas)
  "master-franchise",        // City-level franchise (manages city)
  "admin"              // Full system access
];

const membershipTypes = [
  "Core Membership",
  "Flagship Membership",
  "Industria Membership",
  "Digital Membership",
  "Digital Membership Trial",
];

const REQUIRED_FEES: Record<string, string[]> = {
  "Core Membership": ["Registration", "Annual", "Community_launching"],
  "Flagship Membership": ["Registration", "Annual", "Community_launching"],
  "Industria Membership": ["Registration", "Annual", "Community_launching"],
  "Digital Membership": ["Registration"],
};

const getRequiredPaymentCount = (membershipType?: string) => {
  if (!membershipType) return 0;
  return REQUIRED_FEES[membershipType]?.length || 0;
};

const normalizeFeeType = (feeType: string) => {
  return feeType.toLowerCase().replace(/[_\s]+/g, " ").trim();
};

const getAllPaymentsForDisplay = (user: any) => {
  const existing = user.paymentVerification || [];
  if (!user.membershipType) return existing;

  const required = REQUIRED_FEES[user.membershipType] || [];
  const paidTypes = new Set(existing.map((p: any) => normalizeFeeType(p.feeType)));

  const missing = required.filter((t: string) => !paidTypes.has(normalizeFeeType(t))).map((feeType: string) => ({
    feeType,
    amount: 0,
    status: "pending",
    transactionId: null,
    date: undefined
  }));

  return [...existing, ...missing];
};

interface PaymentVerification {
  feeType: string;
  amount: number;
  status: 'pending' | 'completed';
  date?: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  cashId?: string;
  checkId?: string;
  _id?: string;
}



interface CoreMember {
  _id: string;
  fname: string;
  lname: string;
}


interface Customer {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  mobile: number;
  area?: string;
  membershipStatus: boolean;
  totalPaidAmount: number;
  paymentStatus: string;
  isApproved: boolean;
  referBy?: string;
  role: string;
  avatar?: string;
  isEmailVerified?: boolean;
  username?: string;
  profile?: string;
  connections?: string[];
  isActive?: boolean;
  isLogin?: number;
  membershipType?: string;
  onboardingComplete?: boolean;
  renewalDate?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  paymentVerification?: PaymentVerification[];
  paymentVerificationStatus?: boolean;
  city?: string;
  state?: string;
  country?: string;
  areaId?: string;
  zoneId?: string;
}

interface CoreMember {
  _id: string;
  fname: string;
  lname: string;
}

const CustomersPage: React.FC = () => {
  const { isSidebarAndHeaderVisible, setSidebarAndHeaderVisibility } =
    useVisibility();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedMembershipType, setSelectedMembershipType] =
    useState<string>("");
  const [
    selectedPaymentVerificationStatus,
    setSelectedPaymentVerificationStatus,
  ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([]);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"add" | "update" | "delete">(
    "add"
  );
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [viewPaymentUser, setViewPaymentUser] = useState<Customer | null>(null);

  const openPaymentModal = (user: any) => {
    console.log("Opening Payment Modal for:", user);
    console.log("Payment Verification Data:", user.paymentVerification);
    setViewPaymentUser(user);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setViewPaymentUser(null);
  };

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    mobile: "",
    referBy: "",
    totalPaidAmount: "",
    paymentStatus: "pending",
    role: "",
    membershipType: "",
    username: "",
    city: "",
    state: "",
    country: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 2FA Security State
  const [is2FAModalOpen, set2FAModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Callback when 2FA is verified successfully
  const on2FASuccess = async () => {
    set2FAModalOpen(false);
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
  };

  const handleDeleteUser = async (id?: string) => {
    // defined targetId using passed id or fall back to selectedUser?._id if no id provided.
    // However, usually we should just use the passed id to be safe.
    const targetId = id;

    if (!targetId) {
      toast.error("No user selected for deletion.");
      return;
    }

    // 1. Define the actual delete logic as a function
    const executeDelete = async () => {
      try {
        const response = await api.delete(`/users/delete/${targetId}`); // API endpoint to delete user

        if (response.data.success) {
          setCustomers((prev) => prev.filter((u) => u._id !== targetId));
          // Delete confirmation dialog is managed via 2FA modal now
          setShowModal(false);
          setSelectedUser(null);
          toast.success("User deleted successfully!");
          fetchData();
        }
      } catch (error: any) {
        console.error("Error deleting user:", error.response?.data?.message || error.message);
        toast.error("Failed to delete user.");
      }
    };

    // 2. Trigger 2FA Modal instead of deleting directly
    setPendingAction(() => executeDelete);
    set2FAModalOpen(true);
  };

  const fetchData = async () => {
    try {
      const [usersResponse, coreMembersResponse] =
        await Promise.all([
          api.get("/users/getallusers"),
          api.get("/core-members/"),
        ]);

      if (usersResponse.data.success) {
        const users = Array.isArray(usersResponse.data.data.users)
          ? usersResponse.data.data.users
          : Array.isArray(usersResponse.data.data)
            ? usersResponse.data.data
            : [];
        const mappedCustomers = users.map((item: any) => {
          const user = item.user || item;
          const [fname, ...lnameParts] = (user.name || "").split(" ");
          const lname = lnameParts.join(" ") || "";
          const totalPaidAmount =
            user.paymentVerification?.reduce(
              (sum: number, payment: PaymentVerification) =>
                sum + (payment.status === "completed" ? payment.amount : 0),
              0
            ) || 0;
          const paymentStatus = user.paymentVerification?.every(
            (payment: PaymentVerification) => payment.status === "completed"
          )
            ? "completed"
            : "pending";
          return {
            _id: user.userId || user._id || "",
            fname: fname || "",
            lname: lname || "",
            email: user.email || "",
            mobile: Number(user.mobile) || 0,
            area: user.area || undefined,
            membershipStatus: user.membershipStatus || false,
            totalPaidAmount,
            paymentStatus,
            isApproved: user.isApproved || false,
            referBy: user.referBy || undefined,
            role: user.role || "user",
            avatar:
              user.avatar ||
              "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
            isEmailVerified: user.isEmailVerified || false,
            username: user.username || "",
            profile: user.profile?._id || user.profile || undefined,
            connections: user.connections || [],
            isActive: user.isActive || false,
            isLogin: user.isLogin || 0,
            membershipType: user.membershipType || "",
            onboardingComplete: user.onboardingComplete || false,
            renewalDate: user.renewalDate
              ? new Date(user.renewalDate).toLocaleDateString()
              : undefined,
            createdAt: user.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : undefined,
            updatedAt: user.updatedAt
              ? new Date(user.updatedAt).toLocaleDateString()
              : undefined,
            __v: user.__v || 0,
            paymentVerification: user.paymentVerification || [],
            paymentVerificationStatus: user.paymentVerificationStatus || false,
            city: user.city || "",
            state: user.state || "",
            country: user.country || "",
          };
        });
        setCustomers(mappedCustomers);
      } else {
        throw new Error(usersResponse.data.message || "Failed to fetch users.");
      }

      if (coreMembersResponse.data.success) {
        setCoreMembers(coreMembersResponse.data.data);
      } else {
        throw new Error("Failed to fetch core members.");
      }


    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong!";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSidebarAndHeaderVisibility(!showModal);
    return () => {
      setSidebarAndHeaderVisibility(true);
    };
  }, [showModal, setSidebarAndHeaderVisibility]);

  const handleDuplicateKeyErrors = (error: any) => {
    const duplicateFields = error.response?.data?.error?.duplicateFields || [];
    if (duplicateFields.includes("email")) {
      setErrors((prev) => ({
        ...prev,
        email: "This email is already registered in the system",
      }));
      return true;
    }
    if (duplicateFields.includes("mobile")) {
      setErrors((prev) => ({
        ...prev,
        mobile: "This mobile number is already registered in the system",
      }));
      return true;
    }
    if (duplicateFields.includes("username")) {
      setErrors((prev) => ({
        ...prev,
        username: "This username is already registered in the system",
      }));
      return true;
    }
    return false;
  };

  const validateRealTime = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    const amountRegex = /^\d+(\.\d{1,2})?$/;

    if (
      touchedFields.fname &&
      formData.fname &&
      !nameRegex.test(formData.fname)
    ) {
      newErrors.fname = "First Name should contain only alphabets";
    }
    if (
      touchedFields.lname &&
      formData.lname &&
      !nameRegex.test(formData.lname)
    ) {
      newErrors.lname = "Last Name should contain only alphabets";
    }
    if (
      touchedFields.email &&
      formData.email &&
      !emailRegex.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }
    if (
      touchedFields.mobile &&
      formData.mobile &&
      !mobileRegex.test(formData.mobile)
    ) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }
    if (
      touchedFields.totalPaidAmount &&
      formData.totalPaidAmount &&
      !amountRegex.test(formData.totalPaidAmount)
    ) {
      newErrors.totalPaidAmount = "Please enter a valid amount";
    }

    // Location validation based on membership type
    const isDigitalMembership =
      formData.membershipType === "Digital Membership" ||
      formData.membershipType === "Digital Membership Trial";

    if (isDigitalMembership) {
      if (touchedFields.city && !formData.city) {
        newErrors.city = "City is required for Digital Membership";
      }
      if (touchedFields.state && !formData.state) {
        newErrors.state = "State is required for Digital Membership";
      }
      if (touchedFields.country && !formData.country) {
        newErrors.country = "Country is required for Digital Membership";
      }
    }

    if (touchedFields.paymentStatus && !formData.paymentStatus) {
      newErrors.paymentStatus = "Payment Status is required";
    }
    if (touchedFields.role && !formData.role) {
      newErrors.role = "Role is required";
    }
    if (touchedFields.membershipType && !formData.membershipType) {
      newErrors.membershipType = "Membership Type is required";
    }
    if (
      touchedFields.username &&
      formData.username &&
      !/^[A-Za-z0-9_]+$/.test(formData.username)
    ) {
      newErrors.username =
        "Username should contain only letters, numbers, or underscores";
    }

    setErrors(newErrors);
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    validateRealTime();
  };

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      const allFields = Object.keys(formData);
      const newTouchedFields = allFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      setTouchedFields(newTouchedFields);
      validateRealTime();
      if (Object.keys(errors).length > 0) return;

      try {


        const userDataToSubmit = {
          name: `${formData.fname} ${formData.lname}`.trim(),
          email: formData.email,
          mobile: formData.mobile,
          referBy: formData.referBy || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          country: formData.country || undefined,
          membershipType: formData.membershipType,
          role: formData.role,
          username: formData.username || undefined,
        };

        const response = await api.post("/users/register", userDataToSubmit);
        if (response.data.success) {
          toast.success("User added successfully!", {
            position: "top-center",
            autoClose: 2000,
          });

          setShowModal(false);
          setFormData({
            fname: "",
            lname: "",
            email: "",
            mobile: "",
            referBy: "",

            totalPaidAmount: "",
            paymentStatus: "pending",
            role: "",
            membershipType: "",
            username: "",
            city: "",
            state: "",
            country: "",
          });
          setTouchedFields({});

          // Refresh data
          await fetchData();
        } else {
          throw new Error(response.data.message || "Failed to add user.");
        }
      } catch (error: any) {
        const isDuplicateError = handleDuplicateKeyErrors(error);
        const errorMessage =
          error.response?.data?.message || "Error adding user. Please try again.";
        toast.error(
          isDuplicateError
            ? "User already exists with this email, mobile number, or username"
            : errorMessage,
          {
            position: "top-center",
            autoClose: 3000,
          }
        );
      }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      const allFields = Object.keys(formData);
      const newTouchedFields = allFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      setTouchedFields(newTouchedFields);
      validateRealTime();
      if (Object.keys(errors).length > 0 || !selectedUser) return;

      try {
        const userDataToSubmit = {
          fname: formData.fname,
          lname: formData.lname,
          email: formData.email,
          mobile: formData.mobile,
          referBy: formData.referBy || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          country: formData.country || undefined,
          membershipType: formData.membershipType,
          role: formData.role,
          username: formData.username || undefined,
        };

        const response = await api.put(
          `/users/update/${selectedUser._id}`,
          userDataToSubmit
        );
        if (response.data.success) {
          toast.success(response.data.message || "User updated successfully!", {
            position: "top-center",
            autoClose: 2000,
          });

          setShowModal(false);
          setFormData({
            fname: "",
            lname: "",
            email: "",
            mobile: "",
            referBy: "",

            totalPaidAmount: "",
            paymentStatus: "pending",
            role: "",
            membershipType: "",
            username: "",
            city: "",
            state: "",
            country: "",
          });
          setTouchedFields({});

          // Refresh data
          await fetchData();
        } else {
          throw new Error(response.data.message || "Failed to update user.");
        }
      } catch (error: any) {
        const isDuplicateError = handleDuplicateKeyErrors(error);
        let errorMessage = "Error updating user. Please try again.";
        if (isDuplicateError) {
          errorMessage = `Update failed: ${error.response?.data?.error?.duplicateFields.join(
            ", "
          )} already in use`;
        } else if (
          error.response?.data?.message.includes("Invalid membership type")
        ) {
          setErrors((prev) => ({
            ...prev,
            membershipType: "Invalid membership type",
          }));
          errorMessage = "Invalid membership type selected.";
        } else if (error.response?.data?.message.includes("User not found")) {
          errorMessage = "User not found.";
        }
        toast.error(errorMessage, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    };



    // const openAddModal = () => {
    //   setModalType("add");
    //   setShowModal(true);
    //   setFormData({
    //     fname: "",
    //     lname: "",
    //     email: "",
    //     mobile: "",
    //     referBy: "",
    //     region: "",
    //     totalPaidAmount: "",
    //     paymentStatus: "pending",
    //     role: "",
    //     membershipType: "",
    //     username: "",
    //     city: "",
    //     state: "",
    //     country: "",
    //   });
    //   setErrors({});
    //   setTouchedFields({});
    // };

    const openUpdateModal = (user: Customer) => {
      setModalType("update");
      setSelectedUser(user);
      setShowModal(true);
      setFormData({
        fname: user.fname || "",
        lname: user.lname || "",
        email: user.email || "",
        mobile: user.mobile.toString() || "",
        referBy: user.referBy || "",

        totalPaidAmount: user.totalPaidAmount.toString() || "",
        paymentStatus: user.paymentStatus || "pending",
        role: user.role || "",
        membershipType: user.membershipType || "",
        username: user.username || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
      });
      setErrors({});
      setTouchedFields({});
    };



    useEffect(() => {
      validateRealTime();
    }, [formData, touchedFields]);

    const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    };

    // Extract unique membership types for filter dropdown
    const uniqueMembershipTypes = useMemo(() => {
      const types = new Set(customers.map((c) => c.membershipType).filter(Boolean));
      return Array.from(types).sort();
    }, [customers]);

    const filteredCustomers = customers.filter(
      (customer) =>
        Object.values(customer)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) &&

        (selectedRole === "" || customer.role === selectedRole) &&
        (selectedMembershipType === "" ||
          customer.membershipType === selectedMembershipType) &&
        (selectedPaymentVerificationStatus === "" ||
          customer.paymentVerificationStatus?.toString() ===
          selectedPaymentVerificationStatus) &&
        (!columnFilters.name || `${customer.fname} ${customer.lname}`.toLowerCase().includes(columnFilters.name.toLowerCase())) &&
        (!columnFilters.email || customer.email.toLowerCase().includes(columnFilters.email.toLowerCase())) &&
        (!columnFilters.membershipType || customer.membershipType?.toLowerCase().includes(columnFilters.membershipType.toLowerCase()))
    );

    if (sortConfig) {
      filteredCustomers.sort((a: any, b: any) => {
        let aValue = (a as any)[sortConfig.key];
        let bValue = (b as any)[sortConfig.key];

        if (sortConfig.key === 'name') {
          aValue = `${a.fname} ${a.lname}`.toLowerCase();
          bValue = `${b.fname} ${b.lname}`.toLowerCase();
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue ? bValue.toLowerCase() : '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    const csvData = [
      [
        "Name",
        "Email",
        "Mobile",
        "Area",
        "Total Paid Amount",
        "Payment Status",
        "Role",
        "Membership Status",
        "Is Approved",
        "Referred By",
        "Avatar",
        "Username",
        "Profile",
        "Connections",
        "Is Active",
        "Is Login",
        "Membership Type",
        "Email Verified",
        "Onboarding Complete",
        "Renewal Date",
        "Created At",
        "Updated At",
        "Version (__v)",
        "Payment Verification Status",
        "City",
        "State",
        "Country",
      ],
      ...filteredCustomers.map((customer) => [
        `${customer.fname} ${customer.lname}`,
        customer.email,
        customer.mobile,
        customer.area || "-",
        customer.totalPaidAmount,
        customer.paymentStatus,
        customer.role,
        customer.membershipStatus ? "Active" : "Inactive",
        customer.isApproved ? "Yes" : "No",
        customer.referBy || "-",
        customer.avatar || "-",
        customer.username || "-",
        customer.profile || "-",
        customer.connections && customer.connections.length > 0
          ? customer.connections.join(", ")
          : "-",
        customer.isActive ? "Yes" : "No",
        customer.isLogin || "0",
        customer.membershipType || "-",
        customer.isEmailVerified ? "Yes" : "No",
        customer.onboardingComplete ? "Yes" : "No",
        customer.renewalDate || "-",
        customer.createdAt || "-",
        customer.updatedAt || "-",
        customer.__v || "0",
        customer.paymentVerificationStatus ? "Verified" : "Not Verified",
        customer.city || "-",
        customer.state || "-",
        customer.country || "-",
      ]),
    ];



    return (
      <Box
        className={`w-full flex flex-col items-center ${!isSidebarAndHeaderVisible ? "mt-0" : ""}`}
        sx={{
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'auto',
        }}
      >
        {loading && (
          <p className="text-center text-blue-600 font-semibold">
            🔄 Loading users...
          </p>
        )}
        {error && (
          <p className="text-center text-red-600 font-semibold">
            ❌ Error: {error}
          </p>
        )}
        {!loading && !error && (
          <div className="p-4 w-full">
            <div className="p-4 w-full flex justify-between items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md w-full max-w-md"
                />
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMembershipType}
                  onChange={(e) => setSelectedMembershipType(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Membership Types</option>
                  {membershipTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPaymentVerificationStatus}
                  onChange={(e) =>
                    setSelectedPaymentVerificationStatus(e.target.value)
                  }
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Payment Verification Status</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
                {/* <button
                onClick={openAddModal}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add User
              </button> */}
                <CSVLink
                  data={csvData}
                  filename="customers.csv"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download CSV
                </CSVLink>
              </div>
            </div>
            {showModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                      {modalType === "add" ? "Add User" : "Update User"}
                    </h2>
                    <div className="flex space-x-4">
                      {modalType === "update" && (
                        <button
                          onClick={() => handleDeleteUser(selectedUser?._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ✖️
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <form
                      onSubmit={
                        modalType === "add" ? handleAddUser : handleUpdateUser
                      }
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={formData.fname}
                            onChange={(e) =>
                              setFormData({ ...formData, fname: e.target.value })
                            }
                            onBlur={() => handleFieldBlur("fname")}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            required
                          />
                          {errors.fname && (
                            <p className="text-red-500 text-sm">{errors.fname}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={formData.lname}
                            onChange={(e) =>
                              setFormData({ ...formData, lname: e.target.value })
                            }
                            onBlur={() => handleFieldBlur("lname")}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                          />
                          {errors.lname && (
                            <p className="text-red-500 text-sm">{errors.lname}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                              if (errors.email) {
                                setErrors({ ...errors, email: "" });
                              }
                              setFormData({ ...formData, email: e.target.value });
                            }}
                            onBlur={() => handleFieldBlur("email")}
                            className={`mt-1 p-2 border ${errors.email ? "border-red-500" : "border-gray-300"
                              } rounded-md w-full`}
                            required
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm">{errors.email}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Mobile *
                          </label>
                          <input
                            type="text"
                            value={formData.mobile}
                            onChange={(e) => {
                              const value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10);
                              if (errors.mobile) {
                                setErrors({ ...errors, mobile: "" });
                              }
                              setFormData({ ...formData, mobile: value });
                            }}
                            onBlur={() => handleFieldBlur("mobile")}
                            className={`mt-1 p-2 border ${errors.mobile ? "border-red-500" : "border-gray-300"
                              } rounded-md w-full`}
                            required
                            maxLength={10}
                            inputMode="numeric"
                          />
                          {errors.mobile && (
                            <p className="text-red-500 text-sm">
                              {errors.mobile}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Username
                          </label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => {
                              if (errors.username) {
                                setErrors({ ...errors, username: "" });
                              }
                              setFormData({
                                ...formData,
                                username: e.target.value,
                              });
                            }}
                            onBlur={() => handleFieldBlur("username")}
                            className={`mt-1 p-2 border ${errors.username
                              ? "border-red-500"
                              : "border-gray-300"
                              } rounded-md w-full`}
                          />
                          {errors.username && (
                            <p className="text-red-500 text-sm">
                              {errors.username}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Referred By (Optional)
                          </label>
                          <select
                            value={formData.referBy}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                referBy: e.target.value,
                              })
                            }
                            onBlur={() => handleFieldBlur("referBy")}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                          >
                            <option value="">
                              Select Core Member (Optional)
                            </option>
                            {coreMembers.map((member) => (
                              <option key={member._id} value={member._id}>
                                {member.fname} {member.lname}
                              </option>
                            ))}
                          </select>
                          {formData.referBy && (
                            <p className="mt-2 text-sm text-gray-500">
                              Selected:{" "}
                              {coreMembers.find(
                                (member) => member._id === formData.referBy
                              )?.fname || ""}{" "}
                              {coreMembers.find(
                                (member) => member._id === formData.referBy
                              )?.lname || ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Membership Type *
                          </label>
                          <select
                            value={formData.membershipType}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                membershipType: e.target.value,
                              });
                              // Clear location fields when membership type changes
                              if (
                                e.target.value !== "Digital Membership" &&
                                e.target.value !== "Digital Membership Trial"
                              ) {
                                setFormData((prev) => ({
                                  ...prev,
                                  city: "",
                                  state: "",
                                  country: "",
                                }));
                              }
                            }}
                            onBlur={() => handleFieldBlur("membershipType")}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            required
                          >
                            <option value="">Select Membership Type</option>
                            {membershipTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          {errors.membershipType && (
                            <p className="text-red-500 text-sm">
                              {errors.membershipType}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Role *
                          </label>
                          <select
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({ ...formData, role: e.target.value })
                            }
                            onBlur={() => handleFieldBlur("role")}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            required
                          >
                            <option value="">Select Role</option>
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          {errors.role && (
                            <p className="text-red-500 text-sm">{errors.role}</p>
                          )}
                        </div>
                      </div>
                      {/* Location fields */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            City *
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                            onBlur={() => handleFieldBlur("city")}
                            className={`mt-1 p-2 border ${errors.city ? "border-red-500" : "border-gray-300"
                              } rounded-md w-full`}
                            required
                          />
                          {errors.city && (
                            <p className="text-red-500 text-sm">
                              {errors.city}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            State *
                          </label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                state: e.target.value,
                              })
                            }
                            onBlur={() => handleFieldBlur("state")}
                            className={`mt-1 p-2 border ${errors.state
                              ? "border-red-500"
                              : "border-gray-300"
                              } rounded-md w-full`}
                            required
                          />
                          {errors.state && (
                            <p className="text-red-500 text-sm">
                              {errors.state}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Country *
                          </label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                country: e.target.value,
                              })
                            }
                            onBlur={() => handleFieldBlur("country")}
                            className={`mt-1 p-2 border ${errors.country
                              ? "border-red-500"
                              : "border-gray-300"
                              } rounded-md w-full`}
                            required
                          />
                          {errors.country && (
                            <p className="text-red-500 text-sm">
                              {errors.country}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full font-medium"
                        >
                          {modalType === "add" ? "Add User" : "Update User"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )
            }



            <Paper sx={{ width: '100%', boxShadow: 2, borderRadius: 2, overflow: 'visible' }}>
              <TableContainer sx={{ overflow: 'visible' }}>
                <Table size="small" aria-label="sticky table" sx={{ '& .MuiTableCell-root': { padding: '4px 8px' }, minWidth: 1600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 200 }}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <TableSortLabel
                              active={sortConfig?.key === 'name'}
                              direction={sortConfig?.key === 'name' ? sortConfig.direction : 'asc'}
                              onClick={() => handleSort('name')}
                            >
                              Name
                            </TableSortLabel>
                          </div>
                          <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Filter..."
                            value={columnFilters.name || ''}
                            onChange={(e) => setColumnFilters({ ...columnFilters, name: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem', backgroundColor: 'white' } }}
                          />
                        </div>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 200 }}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <TableSortLabel
                              active={sortConfig?.key === 'email'}
                              direction={sortConfig?.key === 'email' ? sortConfig.direction : 'asc'}
                              onClick={() => handleSort('email')}
                            >
                              Email
                            </TableSortLabel>
                          </div>
                          <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Filter..."
                            value={columnFilters.email || ''}
                            onChange={(e) => setColumnFilters({ ...columnFilters, email: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem', backgroundColor: 'white' } }}
                          />
                        </div>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 120 }}>Mobile</TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 150 }}>Location</TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 100 }}>Role</TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 150 }}>Referred By</TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 100 }}>Username</TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 200 }}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <TableSortLabel
                              active={sortConfig?.key === 'membershipType'}
                              direction={sortConfig?.key === 'membershipType' ? sortConfig.direction : 'asc'}
                              onClick={() => handleSort('membershipType')}
                            >
                              Membership
                            </TableSortLabel>
                          </div>
                          <FormControl size="small" fullWidth sx={{ backgroundColor: 'white', borderRadius: 1 }}>
                            <Select
                              value={columnFilters.membershipType || ''}
                              onChange={(e) => setColumnFilters({ ...columnFilters, membershipType: e.target.value })}
                              displayEmpty
                              variant="outlined"
                              onClick={(e) => e.stopPropagation()}
                              sx={{ fontSize: '0.8rem', height: 32 }}
                            >
                              <MenuItem value="">
                                <em className="text-gray-400">All</em>
                              </MenuItem>
                              {uniqueMembershipTypes.map((type) => (
                                <MenuItem key={type} value={type} sx={{ fontSize: '0.8rem' }}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </div>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 120 }}>
                        <TableSortLabel
                          active={sortConfig?.key === 'totalPaidAmount'}
                          direction={sortConfig?.key === 'totalPaidAmount' ? sortConfig.direction : 'asc'}
                          onClick={() => handleSort('totalPaidAmount')}
                        >
                          Total Paid
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 120 }}>
                        <TableSortLabel
                          active={sortConfig?.key === 'renewalDate'}
                          direction={sortConfig?.key === 'renewalDate' ? sortConfig.direction : 'asc'}
                          onClick={() => handleSort('renewalDate')}
                        >
                          Renewal Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 140 }}>Payment Info</TableCell>
                      <TableCell sx={{ backgroundColor: '#f9fafb', minWidth: 80 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((customer) => {
                        return (
                          <TableRow hover role="checkbox" tabIndex={-1} key={customer._id}>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {customer.fname} {customer.lname}
                            </TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.mobile}</TableCell>
                            <TableCell>
                              {customer.membershipType === "Digital Membership" ||
                                customer.membershipType === "Digital Membership Trial"
                                ? `${customer.city || ""}, ${customer.state || ""}, ${customer.country || ""
                                  }`.replace(/^,\s*|,\s*$/g, "") || "-"
                                : customer.area || "-"}
                            </TableCell>
                            <TableCell>{customer.role}</TableCell>
                            <TableCell>
                              {coreMembers.find((member) => member._id === customer.referBy)
                                ? `${coreMembers.find((member) => member._id === customer.referBy)?.fname} ${coreMembers.find((member) => member._id === customer.referBy)?.lname}`
                                : customer.referBy || "-"}
                            </TableCell>
                            <TableCell>{customer.username || "-"}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.membershipType?.includes('Core') ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                {customer.membershipType || "-"}
                              </span>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>₹{customer.totalPaidAmount}</TableCell>
                            <TableCell>{customer.renewalDate || "-"}</TableCell>
                            <TableCell
                              className="text-center cursor-pointer hover:bg-gray-50"
                              onClick={() => openPaymentModal(customer)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <div className={`font-semibold text-xs ${customer.paymentVerificationStatus ? "text-green-600" : "text-yellow-600"}`}>
                                {customer.paymentVerificationStatus ? "Verified" : "Not Verified"}
                              </div>
                              <div className="text-xs">
                                Comp: {customer.paymentVerification?.filter(p => p.status === 'completed').length || 0}
                                <span className="mx-1">/</span>
                                Req: {getRequiredPaymentCount(customer.membershipType)}
                              </div>
                              {(customer.paymentVerification?.filter(p => p.status === 'completed').length || 0) < getRequiredPaymentCount(customer.membershipType) && (
                                <div className="text-red-500 text-xs font-bold animate-pulse">
                                  ⚠️ Incomplete
                                </div>
                              )}
                              <div className="text-blue-600 text-xs underline">View</div>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => openUpdateModal(customer)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit User"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(customer._id)}
                                className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete User"
                              >
                                <Trash2 size={18} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {filteredCustomers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} align="center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={filteredCustomers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </div>
        )}

        {/* Payment Details Modal */}
        {showPaymentModal && viewPaymentUser && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    Payment History: {viewPaymentUser.fname} {viewPaymentUser.lname}
                  </h2>
                  <button
                    onClick={closePaymentModal}
                    className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="overflow-y-auto mb-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Total Paid</p>
                      <p className="text-xl font-bold text-blue-700">₹{viewPaymentUser.totalPaidAmount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Membership</p>
                      <p className="text-xl font-bold text-gray-700">{viewPaymentUser.membershipType}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Renewal Date</p>
                      <p className="text-xl font-bold text-green-700">{viewPaymentUser.renewalDate || "-"}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="text-xl font-bold text-purple-700">{viewPaymentUser.createdAt || "-"}</p>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border border-gray-200">Fee Type</th>
                        <th className="p-2 border border-gray-200">Amount</th>
                        <th className="p-2 border border-gray-200">Status</th>
                        <th className="p-2 border border-gray-200">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllPaymentsForDisplay(viewPaymentUser).length > 0 ? (
                        getAllPaymentsForDisplay(viewPaymentUser).map((payment: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-2 border border-gray-200 capitalize">{payment.feeType.replace(/_/g, " ")}</td>
                            <td className="p-2 border border-gray-200 font-medium">
                              {payment.status === 'pending' ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                `₹${payment.amount}`
                              )}
                            </td>
                            <td className="p-2 border border-gray-200">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${payment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800 animate-pulse'
                                }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="p-2 border border-gray-200 text-xs">
                              {payment.status === 'pending' ? (
                                <span className="text-red-500 font-semibold">Payment Due</span>
                              ) : (
                                <>
                                  <div>ID: {payment.transactionId || payment.razorpayPaymentId || payment.cashId || payment.checkId || "N/A"}</div>
                                  {payment.date && <div className="text-gray-500">{new Date(payment.date).toLocaleDateString()}</div>}
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="p-4 text-center">No records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <button onClick={closePaymentModal} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
                </div>
              </div>
            </div>
        )}

        <ToastContainer />

        {/* 2FA Verification Modal */}
        <TwoFactorVerifyModal
          open={is2FAModalOpen}
          onClose={() => set2FAModalOpen(false)}
          onSuccess={on2FASuccess}
          title="Security Verification"
        />
      </Box>
    );
};

export default CustomersPage;


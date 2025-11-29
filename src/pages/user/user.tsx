import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useVisibility } from "../../context/VisibilityContext";
import { CSVLink } from "react-csv";

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

interface PaymentVerification {
  feeType: string;
  amount: number;
  status: string;
  transactionId?: string | null;
  date?: string;
  _id?: string;
}

interface Customer {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  mobile: number;
  region?: string;
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
}

interface CoreMember {
  _id: string;
  fname: string;
  lname: string;
}

interface Region {
  _id: string;
  regionName: string;
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
  const [regions, setRegions] = useState<Region[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"add" | "update" | "delete">(
    "add"
  );
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    mobile: "",
    referBy: "",
    region: "",
    totalPaidAmount: "",
    paymentStatus: "pending",
    role: "",
    membershipType: "",
    username: "",
    city: "",
    state: "",
    country: "",
  });

  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({});

  const fetchData = async () => {
    try {
      const [usersResponse, coreMembersResponse, regionsResponse] =
        await Promise.all([
          api.get("/users/getallusers"),
          api.get("/core-members/"),
          api.get("/regions/getallregions/"),
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
            region: user.region || undefined,
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
            profile: user.profile || undefined,
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

      if (regionsResponse.data.success) {
        setRegions(regionsResponse.data.data);
      } else {
        throw new Error("Failed to fetch regions.");
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
    setSidebarAndHeaderVisibility(!showModal && !showDeleteConfirmation);
    return () => {
      setSidebarAndHeaderVisibility(true);
    };
  }, [showModal, showDeleteConfirmation, setSidebarAndHeaderVisibility]);

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
    } else {
      if (touchedFields.region && !formData.region) {
        newErrors.region = "Region is required";
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
      const isDigitalMembership =
        formData.membershipType === "Digital Membership" ||
        formData.membershipType === "Digital Membership Trial";

      const userDataToSubmit = {
        name: `${formData.fname} ${formData.lname}`.trim(),
        email: formData.email,
        mobile: formData.mobile,
        referBy: formData.referBy || undefined,
        ...(isDigitalMembership
          ? {
              city: formData.city || undefined,
              state: formData.state || undefined,
              country: formData.country || undefined,
            }
          : {
              region: formData.region || undefined,
            }),
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
          region: "",
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
      const isDigitalMembership =
        formData.membershipType === "Digital Membership" ||
        formData.membershipType === "Digital Membership Trial";

      const userDataToSubmit = {
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        mobile: formData.mobile,
        referBy: formData.referBy || undefined,
        ...(isDigitalMembership
          ? {
              city: formData.city || undefined,
              state: formData.state || undefined,
              country: formData.country || undefined,
            }
          : {
              region: formData.region || undefined,
            }),
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
          region: "",
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await api.delete(`/users/delete/${userToDelete._id}`);
      if (response.data.success) {
        toast.success("User deleted successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
        setShowDeleteConfirmation(false);
        setUserToDelete(null);
        setShowModal(false); // Close the form modal
        setSelectedUser(null); // Clear selected user

        // Refresh data
        await fetchData();
      } else {
        throw new Error(response.data.message || "Failed to delete user.");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Error deleting user. Please try again.";
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
      region: user.region || "",
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

  const openDeleteConfirmation = (user: Customer) => {
    setUserToDelete(user);
    setShowDeleteConfirmation(true);
  };

  useEffect(() => {
    validateRealTime();
  }, [formData, touchedFields]);

  const filteredCustomers = customers.filter(
    (customer) =>
      Object.values(customer)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      (selectedRegion === "" || customer.region === selectedRegion) &&
      (selectedRole === "" || customer.role === selectedRole) &&
      (selectedMembershipType === "" ||
        customer.membershipType === selectedMembershipType) &&
      (selectedPaymentVerificationStatus === "" ||
        customer.paymentVerificationStatus?.toString() ===
          selectedPaymentVerificationStatus)
  );

  const csvData = [
    [
      "Name",
      "Email",
      "Mobile",
      "Region",
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
      customer.region || "-",
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

  const isDigitalMembership =
    formData.membershipType === "Digital Membership" ||
    formData.membershipType === "Digital Membership Trial";

  return (
    <div
      className={`w-full min-h-screen flex flex-col items-center ${
        !isSidebarAndHeaderVisible ? "mt-0" : ""
      }`}
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
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Regions</option>
                {regions.map((region) => (
                  <option key={region._id} value={region.regionName}>
                    {region.regionName}
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
                        onClick={() => openDeleteConfirmation(selectedUser!)}
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
                          className={`mt-1 p-2 border ${
                            errors.email ? "border-red-500" : "border-gray-300"
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
                          className={`mt-1 p-2 border ${
                            errors.mobile ? "border-red-500" : "border-gray-300"
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
                          className={`mt-1 p-2 border ${
                            errors.username
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
                            } else {
                              setFormData((prev) => ({ ...prev, region: "" }));
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
                    {/* Location fields based on membership type */}
                    {isDigitalMembership ? (
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
                            className={`mt-1 p-2 border ${
                              errors.city ? "border-red-500" : "border-gray-300"
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
                            className={`mt-1 p-2 border ${
                              errors.state
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
                            className={`mt-1 p-2 border ${
                              errors.country
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
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Region *
                        </label>
                        <select
                          value={formData.region}
                          onChange={(e) =>
                            setFormData({ ...formData, region: e.target.value })
                          }
                          onBlur={() => handleFieldBlur("region")}
                          className={`mt-1 p-2 border ${
                            errors.region ? "border-red-500" : "border-gray-300"
                          } rounded-md w-full`}
                          required
                        >
                          <option value="">Select Region</option>
                          {regions.map((region) => (
                            <option key={region._id} value={region.regionName}>
                              {region.regionName}
                            </option>
                          ))}
                        </select>
                        {errors.region && (
                          <p className="text-red-500 text-sm">
                            {errors.region}
                          </p>
                        )}
                        {formData.region && (
                          <p className="mt-2 text-sm text-gray-500">
                            Selected: {formData.region}
                          </p>
                        )}
                      </div>
                    )}
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
          )}

          {showDeleteConfirmation && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                <p className="mb-6">
                  Are you sure you want to delete this user?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setUserToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-y-auto">
            <table className="w-full table-auto border-collapse border">
              <thead className="text-black">
                <tr>
                  <th className="border px-8 py-2">Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Mobile</th>
                  <th className="border px-4 py-2">Location</th>
                  <th className="border px-4 py-2">Role</th>
                  <th className="border px-4 py-2">Referred By</th>
                  <th className="border px-4 py-2">Username</th>
                  <th className="border px-4 py-2">Membership Type</th>
                  <th className="border px-4 py-2">Renewal Date</th>
                  <th className="border px-4 py-2">
                    Payment Verification Status
                  </th>
                  <th className="border px-4 py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="border px-8 py-2">
                        {customer.fname} {customer.lname}
                      </td>
                      <td className="border px-4 py-2">{customer.email}</td>
                      <td className="border px-4 py-2">{customer.mobile}</td>
                      <td className="border px-4 py-2">
                        {customer.membershipType === "Digital Membership" ||
                        customer.membershipType === "Digital Membership Trial"
                          ? `${customer.city || ""}, ${customer.state || ""}, ${
                              customer.country || ""
                            }`.replace(/^,\s*|,\s*$/g, "") || "-"
                          : customer.region || "-"}
                      </td>
                      <td className="border px-4 py-2">{customer.role}</td>
                      <td className="border px-4 py-2">
                        {coreMembers.find(
                          (member) => member._id === customer.referBy
                        )
                          ? `${
                              coreMembers.find(
                                (member) => member._id === customer.referBy
                              )?.fname
                            } ${
                              coreMembers.find(
                                (member) => member._id === customer.referBy
                              )?.lname
                            }`
                          : customer.referBy || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {customer.username || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {customer.membershipType || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {customer.renewalDate || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {customer.paymentVerificationStatus
                          ? "Verified"
                          : "Not Verified"}
                      </td>
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => openUpdateModal(customer)}
                          className="px-2 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 w-full"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="text-center py-6 text-gray-600">
                      No users found. Please check API response or network
                      connectivity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default CustomersPage;

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { toast } from "react-toastify";
import api from "../api/api";

// =====================================
// TYPES & INTERFACES
// =====================================

interface CoreMember {
  _id: string;
  fname: string;
  lname: string;
}

interface Region {
  _id: string;
  regionName: string;
}

interface UserFormData {
  fname: string;
  lname?: string;
  email: string;
  mobile: string;
  membershipType: string;
  role: string;
  region?: string;
  city?: string;
  state?: string;
  country?: string;
  referBy?: string;
  username?: string;
}

interface UserFormModalProps {
  show: boolean;
  modalType: "add" | "update";
  onClose: () => void;
  onSuccess: () => void;
  coreMembers: CoreMember[];
  regions: Region[];
  selectedUser?: any;
}

// =====================================
// CONSTANTS
// =====================================

const roles = ["user", "core-member", "admin"];
const membershipTypes = [
  "Core Membership",
  "Flagship Membership",
  "Industria Membership",
  "Digital Membership",
  "Digital Membership Trial",
];

// =====================================
// VALIDATION SCHEMA
// =====================================

const createValidationSchema = (membershipType: string) => {
  const isDigitalMembership =
    membershipType === "Digital Membership" ||
    membershipType === "Digital Membership Trial";

  return yup.object().shape({
    fname: yup
      .string()
      .required("First name is required")
      .matches(/^[A-Za-z]+$/, "First name should contain only alphabets"),

    lname: yup
      .string()
      .matches(/^[A-Za-z]*$/, "Last name should contain only alphabets")
      .optional(),

    email: yup
      .string()
      .required("Email is required")
      .email("Please enter a valid email address"),

    mobile: yup
      .string()
      .required("Mobile number is required")
      .matches(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),

    membershipType: yup
      .string()
      .required("Membership type is required")
      .oneOf(membershipTypes, "Invalid membership type"),

    role: yup
      .string()
      .required("Role is required")
      .oneOf(roles, "Invalid role"),

    // Conditional validation for region (non-Digital memberships)
    region: isDigitalMembership
      ? yup.string().optional()
      : yup.string().required("Region is required for this membership type"),

    // Conditional validation for Digital memberships
    city: isDigitalMembership
      ? yup.string().required("City is required for Digital Membership")
      : yup.string().optional(),

    state: isDigitalMembership
      ? yup.string().required("State is required for Digital Membership")
      : yup.string().optional(),

    country: isDigitalMembership
      ? yup.string().required("Country is required for Digital Membership")
      : yup.string().optional(),

    referBy: yup.string().optional(),

    username: yup
      .string()
      .matches(
        /^[A-Za-z0-9_]*$/,
        "Username should contain only letters, numbers, or underscores"
      )
      .optional(),
  });
};

// =====================================
// COMPONENT
// =====================================

const UserFormModal: React.FC<UserFormModalProps> = ({
  show,
  modalType,
  onClose,
  onSuccess,
  coreMembers,
  regions,
  selectedUser,
}) => {
  // =====================================
  // FORM SETUP
  // =====================================

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setError,
  } = useForm<UserFormData>({
    mode: "onChange", // Validate on change
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      mobile: "",
      membershipType: "",
      role: "",
      region: "",
      city: "",
      state: "",
      country: "",
      referBy: "",
      username: "",
    },
  });

  // Watch membershipType for conditional rendering
  const membershipType = watch("membershipType");
  const isDigitalMembership =
    membershipType === "Digital Membership" ||
    membershipType === "Digital Membership Trial";

  // =====================================
  // EFFECTS
  // =====================================

  // Populate form when editing user
  useEffect(() => {
    if (modalType === "update" && selectedUser) {
      reset({
        fname: selectedUser.fname || "",
        lname: selectedUser.lname || "",
        email: selectedUser.email || "",
        mobile: String(selectedUser.mobile || ""),
        membershipType: selectedUser.membershipType || "",
        role: selectedUser.role || "",
        region: selectedUser.region || "",
        city: selectedUser.city || "",
        state: selectedUser.state || "",
        country: selectedUser.country || "",
        referBy: selectedUser.referBy || "",
        username: selectedUser.username || "",
      });
    }
  }, [modalType, selectedUser, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      reset();
    }
  }, [show, reset]);

  // =====================================
  // SUBMIT HANDLER
  // =====================================

  const onSubmit = async (data: UserFormData) => {
    try {
      // Manual validation based on membership type
      const validationSchema = createValidationSchema(data.membershipType);

      try {
        await validationSchema.validate(data, { abortEarly: false });
      } catch (validationError: any) {
        // Set all validation errors
        validationError.inner?.forEach((err: any) => {
          setError(err.path, {
            type: "manual",
            message: err.message,
          });
        });
        toast.error("Please fix the validation errors", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      const userDataToSubmit = {
        name: `${data.fname} ${data.lname || ""}`.trim(),
        email: data.email,
        mobile: data.mobile,
        membershipType: data.membershipType,
        role: data.role,
        ...(isDigitalMembership
          ? {
              city: data.city,
              state: data.state,
              country: data.country,
            }
          : {
              region: data.region,
            }),
        ...(data.referBy && { referBy: data.referBy }),
        ...(data.username && { username: data.username }),
      };

      let response;
      if (modalType === "add") {
        response = await api.post("/users/register", userDataToSubmit);
      } else {
        response = await api.put(
          `/users/update/${selectedUser._id}`,
          userDataToSubmit
        );
      }

      if (response.data.success) {
        toast.success(
          modalType === "add"
            ? "User added successfully!"
            : "User updated successfully!",
          {
            position: "top-center",
            autoClose: 2000,
          }
        );
        onSuccess();
        onClose();
        reset();
      } else {
        throw new Error(
          response.data.message ||
            `Failed to ${modalType === "add" ? "add" : "update"} user.`
        );
      }
    } catch (error: any) {
      // Handle duplicate key errors
      const duplicateFields =
        error.response?.data?.error?.duplicateFields || [];

      if (duplicateFields.includes("email")) {
        setError("email", {
          type: "manual",
          message: "This email is already registered in the system",
        });
      }

      if (duplicateFields.includes("mobile")) {
        setError("mobile", {
          type: "manual",
          message: "This mobile number is already registered in the system",
        });
      }

      if (duplicateFields.includes("username")) {
        setError("username", {
          type: "manual",
          message: "This username is already registered in the system",
        });
      }

      const errorMessage =
        error.response?.data?.message ||
        `Error ${modalType === "add" ? "adding" : "updating"} user. Please try again.`;

      toast.error(
        duplicateFields.length > 0
          ? "User already exists with this email, mobile number, or username"
          : errorMessage,
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
    }
  };

  // =====================================
  // RENDER
  // =====================================

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {modalType === "add" ? "Add User" : "Update User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl"
            type="button"
          >
            ✖️
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="fname"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`mt-1 p-2 border rounded-md w-full ${
                        errors.fname ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.fname && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fname.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Controller
                  name="lname"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`mt-1 p-2 border rounded-md w-full ${
                        errors.lname ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.lname && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.lname.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email & Mobile */}
            <div className="grid grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      className={`mt-1 p-2 border rounded-md w-full ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="mobile"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      placeholder="10-digit mobile number"
                      className={`mt-1 p-2 border rounded-md w-full ${
                        errors.mobile ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.mobile && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.mobile.message}
                  </p>
                )}
              </div>
            </div>

            {/* Membership Type & Role */}
            <div className="grid grid-cols-2 gap-4">
              {/* Membership Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Membership Type <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="membershipType"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`mt-1 p-2 border rounded-md w-full ${
                        errors.membershipType
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Membership Type</option>
                      {membershipTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.membershipType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.membershipType.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`mt-1 p-2 border rounded-md w-full ${
                        errors.role ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            {/* Conditional: Region OR City/State/Country */}
            {!isDigitalMembership ? (
              /* Region Field (Non-Digital Memberships) */
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="region"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`mt-1 p-2 border rounded-md w-full ${
                          errors.region ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Region</option>
                        {regions.map((region) => (
                          <option key={region._id} value={region._id}>
                            {region.regionName}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.region && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.region.message}
                    </p>
                  )}
                </div>

                {/* Referred By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Referred By
                  </label>
                  <Controller
                    name="referBy"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                      >
                        <option value="">Select Referrer</option>
                        {coreMembers.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.fname} {member.lname}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>
            ) : (
              /* City/State/Country Fields (Digital Memberships) */
              <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className={`mt-1 p-2 border rounded-md w-full ${
                          errors.city ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    )}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className={`mt-1 p-2 border rounded-md w-full ${
                          errors.state ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    )}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className={`mt-1 p-2 border rounded-md w-full ${
                          errors.country ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    )}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Username */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Optional - auto-generated if empty"
                      className={`mt-1 p-2 border rounded-md w-full ${
                        errors.username ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? modalType === "add"
                    ? "Adding..."
                    : "Updating..."
                  : modalType === "add"
                  ? "Add User"
                  : "Update User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;

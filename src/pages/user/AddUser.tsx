import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

// =====================================
// TYPES & INTERFACES
// =====================================

import { Country, State, City } from "country-state-city";

interface UserFormData {
  fname: string;
  lname?: string;
  email: string;
  mobile: string;
  membershipType: string;
  role: string;
  region?: string;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  pincode?: string;
  referBy?: string;
  username?: string;
}

// =====================================
// CONSTANTS
// =====================================

// ✅ USER ROLES ONLY - Franchise roles have separate creation forms
// ✅ USER ROLES ONLY - Franchise roles have separate creation forms
const roles = [
  "user",                    // Default role for all registered users
  "digital-member",          // Digital-only participants
  "core-member",             // Non-leader group members
  "pioneer",                 // Special recognition role (optional)
  "admin"                    // Full system access
];

// Note: dcp, cgc, area-franchise, master-franchise are created via separate franchise forms

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

    // Location Fields (Required for all)
    country: yup.string().required("Country is required"),
    state: yup.string().required("State is required"),
    city: yup.string().required("City is required"),
    area: yup.string().optional(),
    pincode: yup.string().matches(/^[0-9]{6}$/, "Pincode must be 6 digits").optional(),

    // Region (Required for non-digital)
    region: isDigitalMembership
      ? yup.string().optional()
      : yup.string().required("Region is required for this membership type"),

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

const AddUserPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);

  // Location State
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);



  // =====================================
  // FORM SETUP
  // =====================================

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
  } = useForm<UserFormData>({
    mode: "onChange",
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      mobile: "",
      membershipType: "",
      role: "",
      region: "",
      country: "",
      state: "",
      city: "",
      area: "",
      pincode: "",
      referBy: "",
      username: "",
    },
  });

  // Watch membershipType for conditional rendering
  const membershipType = watch("membershipType");
  const isDigitalMembership =
    membershipType === "Digital Membership" ||
    membershipType === "Digital Membership Trial";

  // Watch location fields for cascading dropdowns
  const selectedCountry = watch("country");
  const selectedState = watch("state");


  // =====================================
  // EFFECTS
  // =====================================

  // =====================================
  // EFFECTS
  // =====================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load Countries from library
        setCountries(Country.getAllCountries());


      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch data!";
        toast.error(errorMessage, {
          position: "top-center",
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter states based on selected country
  useEffect(() => {
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry));
      // Reset state and city when country changes
      // Note: react-hook-form handles value updates, but we might need to clear them if needed
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  // Filter cities based on selected state
  useEffect(() => {
    if (selectedCountry && selectedState) {
      setCities(City.getCitiesOfState(selectedCountry, selectedState));
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState]);

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
        // Location Fields (Convert codes to names where applicable)
        country: Country.getCountryByCode(data.country || "")?.name || data.country,
        state: State.getStateByCodeAndCountry(data.state || "", data.country || "")?.name || data.state,
        city: data.city,
        area: data.area,
        pincode: data.pincode,
        // Region (for non-digital)
        ...(!isDigitalMembership && { region: data.region }),


        ...(data.referBy && { referBy: data.referBy }),
        ...(data.username && { username: data.username }),
      };

      const response = await api.post("/users/register", userDataToSubmit);

      if (response.data.success) {
        toast.success("User added successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
        navigate("/user");
      } else {
        throw new Error(response.data.message || "Failed to add user.");
      }
    } catch (error: any) {
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
        error.response?.data?.message || "Error adding user. Please try again.";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50" >
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
              <p className="text-gray-600 mt-2">
                Create a new user account with role and membership assignment
              </p>
            </div>
            <button
              onClick={() => navigate("/user")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              ← Back to Users
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="fname"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.fname ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="Enter first name"
                    />
                  )}
                />
                {errors.fname && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.fname.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <Controller
                  name="lname"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.lname ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="Enter last name (optional)"
                    />
                  )}
                />
                {errors.lname && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.lname.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email & Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="user@example.com"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="mobile"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      maxLength={10}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.mobile ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="10-digit mobile number"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Membership Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="membershipType"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.membershipType
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.role ? "border-red-500" : "border-gray-300"
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

            {/* Location Details */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.country ? "border-red-500" : "border-gray-300"
                          }`}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Reset state and city when country changes
                        }}
                      >
                        <option value="">Select Country</option>
                        {countries.map((c) => (
                          <option key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={!selectedCountry}
                        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.state ? "border-red-500" : "border-gray-300"
                          } ${!selectedCountry ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s.isoCode} value={s.isoCode}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={!selectedState}
                        className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.city ? "border-red-500" : "border-gray-300"
                          } ${!selectedState ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      >
                        <option value="">Select City</option>
                        {cities.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                  )}
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area
                  </label>
                  <Controller
                    name="area"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter Area / Locality"
                      />
                    )}
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <Controller
                    name="pincode"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        maxLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter Pincode"
                      />
                    )}
                  />
                </div>
              </div>
            </div>



            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.username ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Optional - auto-generated if empty"
                  />
                )}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/user")}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding User..." : "Add User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserPage;

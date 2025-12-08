import axios from "axios";

// Define the structure of the API response
interface User {
  _id: string;
  fname: string;
  lname?: string;
  email: string;
  avatar?: string;
  role: "admin" | "core-member" | "master-franchise" | "area-franchise" | "cgc" | "dcp";  // ✅ Role-based access including franchise partners
  isEmailVerified: boolean;
  membershipStatus: boolean;
  mobile: number;
  zoneId?: {
    _id: string;
    zoneName: string;
    cityId: string;
    stateId?: string;
    countryId?: string;
  };
  areaId?: {
    _id: string;
    areaName: string;
    zoneId: string;
  };
}

interface LoginResponse {
  statusCode: number;
  data: {
    user: User;
    refreshToken: string;
    accessToken: string;
  };
  message: string;
  success: boolean;
}

// Access the API base URL from the environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ Function to log in Admin or Core Member
export const loginUser = async (email: string, password: string): Promise<LoginResponse["data"]> => {
  try {
    console.log("Attempting login..."); // Debugging log

    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/users/login`,
      { email, password },
      { withCredentials: true } // Ensure cookies are sent
    );

    console.log("Login successful:", response.data); // Debugging log

    const { user, accessToken, refreshToken } = response.data.data;

    // Store in cookies (primary method)
    document.cookie = `accessToken=${accessToken}; path=/; secure`;
    document.cookie = `refreshToken=${refreshToken}; path=/; secure`;

    // Store in localStorage (backup for API interceptor)
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", accessToken);

    return { user, accessToken, refreshToken };
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message); // Debugging log
    throw new Error(error.response?.data?.message || "Login failed!");
  }
};

// ✅ Function to verify user using stored tokens
export const verifyUser = async (): Promise<User | null> => {
  try {
    const response = await axios.get<{ data: User }>(`${API_BASE_URL}/users/verify`, {
      withCredentials: true,
    });

    const apiUser = response.data.data;

    // ✅ Ensure all required fields are returned
    return {
      _id: apiUser._id,
      fname: apiUser.fname,
      lname: apiUser.lname || "", // Default to an empty string if undefined
      email: apiUser.email,
      avatar: apiUser.avatar || "", // Provide a default if missing
      role: apiUser.role,
      isEmailVerified: apiUser.isEmailVerified,
      membershipStatus: apiUser.membershipStatus,
      mobile: apiUser.mobile,
    };
  } catch (error) {
    console.error("User verification failed:", error);
    return null;
  }
};

// ✅ Function to log out user
export const logoutUser = (): void => {
  document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

  localStorage.removeItem("user");
};

// ✅ Function to get stored user from localStorage
export const getUserFromLocalStorage = (): User | null => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};

export const getUserRole = (): string | null => {
  const user = getUserFromLocalStorage();
  return user?.role || null;
};

// ✅ Function to check if user is an Admin
export const isAdmin = (): boolean => {
  const user = getUserFromLocalStorage();
  return user?.role === "admin";
};

// ✅ Function to check if user is a Core Member
export const isCoreMember = (): boolean => {
  const user = getUserFromLocalStorage();
  return user?.role === "core-member";
};

// ✅ Function to check if user is a Master Franchise Partner
export const isMasterFranchise = (): boolean => {
  const user = getUserFromLocalStorage();
  return user?.role === "master-franchise";
};

// ✅ Function to check if user is an Area Franchise Partner
export const isAreaFranchise = (): boolean => {
  const user = getUserFromLocalStorage();
  return user?.role === "area-franchise";
};

// ✅ Function to check if user is a CGC
export const isCGC = (): boolean => {
  const user = getUserFromLocalStorage();
  return user?.role === "cgc";
};

// ✅ Function to check if user is a DCP
export const isDCP = (): boolean => {
  const user = getUserFromLocalStorage();
  return user?.role === "dcp";
};
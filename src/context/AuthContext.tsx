import React, { createContext, useState, useEffect } from "react";
import { verifyUser, logoutUser } from "../api/auth";

interface User {
  _id: string;
  name: string;  // Combined name
  email: string;
  role: string;
  // Add other properties you need from the API
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  isAdmin: () => boolean;
  isCoreMember: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const verifiedUser = await verifyUser();
      
      if (verifiedUser) {
        // Transform the API user to match our context's User interface
        const contextUser: User = {
          _id: verifiedUser._id,
          name: `${verifiedUser.fname} ${verifiedUser.lname || ''}`.trim(),
          email: verifiedUser.email,
          role: verifiedUser.role,
          // Add other properties as needed
        };
        setUser(contextUser);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    fetchUser();
  }, []);

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const isAdmin = (): boolean => user?.role === "admin";
  const isCoreMember = (): boolean => user?.role === "core-member";

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAdmin, isCoreMember }}>
      {children}
    </AuthContext.Provider>
  );
};
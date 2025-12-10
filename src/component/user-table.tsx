import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // ✅ Import custom axios instance with token handling

interface User {
  firstName: string;
  lastName: string;
  email: string;
  membershipStatus: string;
  renewalDueDate: string;
}

const UserTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  // ✅ Fetch users with authentication
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/dashboard/registered-users");
        const data = response.data;

        if (data.success) {
          // ✅ Map API response to match UI structure
          const mappedUsers = data.data.map((user: any) => ({
            firstName: user.fname,
            lastName: user.lname,
            email: user.email,
            membershipStatus: user.membershipStatus ? "Active" : "Inactive",
            renewalDueDate: new Date(user.renewalDueDate).toLocaleDateString(),
          }));

          // ✅ Get the top 5 users (Backend already sorts by latest)
          const lastFiveUsers = mappedUsers.slice(0, 5);

          setUsers(lastFiveUsers);
        }
      } catch (error: any) {
        console.error("Error fetching users:", error.response?.data?.message || error.message);
      }
    };

    fetchUsers();
  }, []);

  // ✅ Navigate to the full user list
  const handleRedirect = () => {
    navigate("/user");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with Title & Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold text-gray-900">Recent Users</h2>
        <button
          onClick={handleRedirect}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 mt-4 sm:mt-0"
        >
          View All Users
        </button>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white max-h-[400px] min-h-[200px] w-full">
        <table className="table-auto w-full">
          <thead className="bg-gradient-to-r from-blue-500 to-blue-500 text-white">
            <tr>
              <th className="px-6 py-4 text-lg font-semibold text-left">First Name</th>
              <th className="px-6 py-4 text-lg font-semibold text-left">Last Name</th>
              <th className="px-6 py-4 text-lg font-semibold text-left">Email</th>
              {/* <th className="px-6 py-4 text-lg font-semibold text-left">Membership Status</th> */}
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-200 transition-all duration-300 hover:bg-blue-100 ${index % 2 === 0 ? "bg-blue-50" : "bg-white"
                    }`}
                >
                  <td className="px-6 py-3 text-lg text-gray-800 whitespace-nowrap">{user.firstName}</td>
                  <td className="px-6 py-3 text-lg text-gray-800 whitespace-nowrap">{user.lastName}</td>
                  <td className="px-6 py-3 text-lg text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{user.email}</td>
                  {/* <td className="px-6 py-4 text-lg text-gray-800 whitespace-nowrap">{user.membershipStatus}</td> */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-lg text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // ✅ Import custom axios instance

interface User {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  totalPaid: string;
}

const dummyUsers: User[] = [
  { firstName: "John", lastName: "Doe", email: "john.doe@example.com", contactNumber: "9876543210", totalPaid: "$500" },
  { firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", contactNumber: "8765432109", totalPaid: "$600" },
  { firstName: "Michael", lastName: "Brown", email: "michael.brown@example.com", contactNumber: "7654321098", totalPaid: "$700" },
  { firstName: "Emily", lastName: "Davis", email: "emily.davis@example.com", contactNumber: "6543210987", totalPaid: "$550" },
];

const UserTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/core-members/highest-paying-referred-user");
        const data = response.data;

        if (data.success && data.data.length > 0) {
          const mappedUsers = data.data.map((user: any) => ({
            firstName: user.fname || "N/A",
            lastName: user.lname || "N/A",
            email: user.email || "N/A",
            contactNumber: user.mobile ? user.mobile.toString() : "N/A",
            totalPaid: user.totalPaidAmount ? `$${user.totalPaidAmount}` : "$0",
          }));

          setUsers(mappedUsers);
        } else {
          throw new Error("No users found");
        }
      } catch (error: any) {
        console.error("Error fetching users:", error.response?.data?.message || error.message);
        setUsers(dummyUsers);
      }
    };

    fetchUsers();
  }, []);

  // ✅ Navigate to "View All Users"
  // const handleRedirect = () => {
  //   navigate("/user");
  // };

  // ✅ Navigate to "User Core"
  const handleUserCoreRedirect = () => {
    navigate("/user-core");
  };

  return (
    <div className="container p-6 max-w-6xl mt-5">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold text-gray-900">Highest Paying Referred Users</h2>
        <button
                      onClick={handleUserCoreRedirect}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
        >
          View All Users
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg bg-white max-h-[500px] w-full">
        <table className="table-auto w-full">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-4 py-4 text-lg font-semibold text-left">First Name</th>
              <th className="px-4 py-4 text-lg font-semibold text-left">Last Name</th>
              <th className="px-4 py-4 text-lg font-semibold text-left">Email</th>
              <th className="px-4 py-4 text-lg font-semibold text-left">Contact No.</th>
              <th className="px-4 py-4 text-lg font-semibold text-left">Total Paid</th>
              <th className="px-4 py-4 text-lg font-semibold text-left text-center">Actions</th> {/* ✅ New column for button */}
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-200 transition-all duration-300 hover:bg-blue-100 ${
                    index % 2 === 0 ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-3 text-lg text-gray-800 whitespace-nowrap">{user.firstName}</td>
                  <td className="px-4 py-3 text-lg text-gray-800 whitespace-nowrap">{user.lastName}</td>
                  <td className="px-4 py-3 text-lg text-gray-800 whitespace-nowrap">{user.email}</td>
                  <td className="px-4 py-3 text-lg text-gray-800 whitespace-nowrap">{user.contactNumber}</td>
                  <td className="px-4 py-3 text-lg text-gray-800 whitespace-nowrap">{user.totalPaid}</td>
                  <td className="px-4 py-3 text-lg text-gray-800 whitespace-nowrap text-center">
                    {/* ✅ Button to navigate to User Core */}
                   
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-lg text-center text-gray-500">
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

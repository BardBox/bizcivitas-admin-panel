import { useEffect, useState } from "react";
import api from "../../api/api"; // Import the Axios instance


interface User {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  mobile: number;
  city: string;
  state: string;
  createdAt: string;
}

const ReferredUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token"); // Get stored token
        if (!token) throw new Error("Unauthorized: No token found.");

        const response = await api.get("/core-members/referred-users/");
        setUsers(response.data.data);
        console.log(response.data.data)// Set fetched users
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p className="text-center py-8">Loading your referred users...</p>;
  if (error) return <p className="text-red-500 text-center py-8">Error: {error}</p>;

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Referred Users</h1>
        <p className="text-gray-600">
          You have referred <span className="font-semibold text-blue-600">{users.length}</span> {users.length === 1 ? 'person' : 'people'} to BizCivitas platform
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage all the users you've successfully referred to grow your network
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">First Name</th>
              <th className="border p-2">Last Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Mobile</th>
              <th className="border p-2">City</th>
              <th className="border p-2">State</th>
              <th className="border p-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border">
                <td className="border p-2">{user.fname}</td>
                <td className="border p-2">{user.lname}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.mobile}</td>
                <td className="border p-2">{user.city}</td>
                <td className="border p-2">{user.state}</td>
                <td className="border p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg mt-4">
          <p className="text-gray-600 text-lg">You haven't referred any users yet</p>
          <p className="text-gray-500 text-sm mt-2">Start referring people to grow your network and earn rewards!</p>
        </div>
      )}
    </div>
  );
};

export default ReferredUsers;
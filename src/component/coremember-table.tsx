import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

interface Coremember {
  fname: string;
  lname: string;
  email: string;
}

const CorememberTable: React.FC = () => {
  const [coremembers, setCoremembers] = useState<Coremember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoremembers = async () => {
      try {
        const response = await api.get("/dashboard/registered-coremember");
        const data = response.data;

        if (data.success) {
          const mappedCoremembers = data.data
            .map((member: any) => ({
              fname: member.fname,
              lname: member.lname,
              email: member.email,
            }))
            .slice(0, 6);

          setCoremembers(mappedCoremembers);
        } else {
          throw new Error("Failed to fetch core members");
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Something went wrong!");
      } finally {
        setLoading(false);
      }
    };

    fetchCoremembers();
  }, []);

  const handleRedirect = () => {
    navigate("/core");
  };

  if (loading) {
    return <div className="text-center text-lg text-blue-600">Loading core members...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold text-gray-900">Core Member Table</h2>
        <button
          onClick={handleRedirect}
          className="bg-blue-600 text-white px-6 py-3  rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
        >
          View All Core Members
        </button>
      </div>

      {/* Table Container with Fixed Height */}
      <div className="overflow-hidden rounded-lg shadow-lg bg-white border border-gray-300">
        <div className="overflow-x-auto min-h-[200px] max-h-[400px]">
          <table className="table-auto w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-lg font-semibold text-left">First Name</th>
                <th className="px-6 py-4 text-lg font-semibold text-left">Last Name</th>
                <th className="px-6 py-4 text-lg font-semibold text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {coremembers.length > 0 ? (
                coremembers.map((member, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 transition-all duration-300 hover:bg-blue-100 ${
                      index % 2 === 0 ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-3 text-lg text-gray-800">{member.fname}</td>
                    <td className="px-6 py-3 text-lg text-gray-800">{member.lname}</td>
                    <td className="px-6 py-3 text-lg text-gray-800 whitespace-nowrap text-ellipsis overflow-hidden max-w-[150px]">
                      {member.email}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-lg text-center text-gray-500">
                    No core members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CorememberTable;

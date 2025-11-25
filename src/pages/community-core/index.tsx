import React, { useState, useEffect } from "react";
import {  useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";
// import Loader from "../../component/Loader";

interface Community {
  _id: string;
  communityName: string;
  image: string; // Assuming this is the image filename or path
  coreMembers: { _id: string; name: string }[]; // Array of core members
}

const CommunityCore: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch communities on component mount
  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await api.get("/core-members/getAllCommunitiesOfCoreMember/");
      setCommunities(response.data.data); // Assuming the API returns an array of communities
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to fetch communities.");
      setError("Failed to fetch communities.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCommunity = (communityId: string) => {
    navigate(`/community-members/${communityId}`);
  };

  return (
    <div className="p-8">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header */}
      {/* <h1 className="text-2xl font-bold mb-6 text-center">Community Core</h1> */}

      {/* Loading State */}
      {/* {isLoading && <Loader />} */}

      {/* Error Handling */}
      {error && <p className="text-center text-red-600">Error: {error}</p>}

      {/* Community List */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <div key={community._id} className="bg-white border rounded-lg shadow-lg p-4">
              {/* Community Image */}
              <img
                src={`https://backend.bizcivitas.com/api/v1/image/${community.image}`}
                alt={community.communityName}
                className="w-full h-48 object-cover rounded-md mb-4"
              />

              {/* Community Name */}
              <h2 className="text-lg font-bold">{community.communityName}</h2>

              {/* Core Members */}
              <div className="mt-2">
                <strong>Core Members:</strong>
                <ul className="list-disc pl-4">
                  {community.coreMembers.map((member) => (
                    <li key={member._id}>{member.name}</li>
                  ))}
                </ul>
              </div>

              {/* Open Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleOpenCommunity(community._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Data Case */}
      {!isLoading && !error && communities.length === 0 && (
        <p className="text-center text-gray-600">No communities found.</p>
      )}
    </div>
  );
};

export default CommunityCore;
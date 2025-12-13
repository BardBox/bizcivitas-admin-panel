import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";
import CGCPositionModal from "../../components/CGCPositionModal";
// import Loader from "../../component/Loader";

interface Community {
  _id: string;
  communityName: string;
  image: string;
  coreMembers: { _id: string; name: string }[];
  cgc?: { _id: string; fname: string; lname: string }[] | null;
  coreGroup?: {
    _id: string;
    name: string;
  } | null;
}

interface CoreGroup {
  _id: string;
  name: string;
  coreMembers: { _id: string; fname: string; lname: string }[];
  cgc?: { _id: string; fname: string; lname: string }[] | null;
  countries: string[];
  states: string[];
  cities: string[];
}

const CommunityCore: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"communities" | "coreGroups">(
    "communities"
  );
  const [communities, setCommunities] = useState<Community[]>([]);
  const [coreGroups, setCoreGroups] = useState<CoreGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<CoreGroup | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCGCModal, setShowCGCModal] = useState(false);
  const navigate = useNavigate();

  const handleGroupClick = (group: CoreGroup) => {
    setSelectedGroup(group);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGroup(null);
  };

  const handleEditCGCPositions = (e: React.MouseEvent, group: CoreGroup) => {
    e.stopPropagation(); // Prevent triggering handleGroupClick
    setSelectedGroup(group);
    setShowCGCModal(true);
  };

  const closeCGCModal = () => {
    setShowCGCModal(false);
  };

  const handleCGCPositionSuccess = () => {
    fetchCoreGroups(); // Refresh the core groups list
    toast.success("CGC positions updated successfully!");
  };

  useEffect(() => {
    if (activeTab === "communities") {
      fetchCommunities();
    } else {
      fetchCoreGroups();
    }
  }, [activeTab]);

  const fetchCommunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        "/core-members/getAllCommunitiesOfCoreMember/"
      );
      console.log("Communities data:", response.data.data);
      console.log("First community image:", response.data.data[0]?.image);
      setCommunities(response.data.data);
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to fetch communities.");
      setError("Failed to fetch communities.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoreGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        "/core-members/getAllCoreGroupsOfCoreMember"
      );
      setCoreGroups(response.data.data);
    } catch (error) {
      console.error("Error fetching core groups:", error);
      toast.error("Failed to fetch core groups.");
      setError("Failed to fetch core groups.");
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("communities")}
          className={`px-6 py-3 font-semibold text-lg ${
            activeTab === "communities"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Communities
        </button>
        <button
          onClick={() => setActiveTab("coreGroups")}
          className={`px-6 py-3 font-semibold text-lg ml-4 ${
            activeTab === "coreGroups"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Core Groups
        </button>
      </div>

      {/* Error Handling */}
      {error && <p className="text-center text-red-600">Error: {error}</p>}

      {/* Communities Tab Content */}
      {activeTab === "communities" && !isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <div
              key={community._id}
              className="bg-white border rounded-lg shadow-lg p-4"
            >
              {community.image ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/image/${
                    community.image
                  }`}
                  alt={community.communityName}
                  className="w-full h-48 object-cover rounded-md mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    // Use inline SVG as fallback
                    target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%239ca3af'%3EImage Not Found%3C/text%3E%3C/svg%3E";
                    console.log("Failed to load image:", community.image);
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}

              <h2 className="text-lg font-bold">{community.communityName}</h2>

              {/* Core Group Badge */}
              {community.coreGroup && (
                <div className="mt-3 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    🏢 Core Group:
                  </p>
                  <p className="text-sm text-blue-700 font-medium pl-5">
                    {community.coreGroup.name}
                  </p>
                </div>
              )}

              {/* CGC Badge - Community Leaders */}
              {community.cgc && community.cgc.length > 0 && (
                <div className="mt-3 mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    👑 Leader{community.cgc.length > 1 ? "s" : ""}:
                  </p>
                  <ul className="pl-5">
                    {community.cgc.map((cgc) => (
                      <li
                        key={cgc._id}
                        className="text-sm text-green-700 font-medium"
                      >
                        • {`${cgc.fname} ${cgc.lname}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Core Members */}
              <div className="mt-2">
                <strong>Core Members:</strong>
                <ul className="list-disc pl-4">
                  {community.coreMembers.map((member) => (
                    <li key={member._id}>{member.name}</li>
                  ))}
                </ul>
              </div>

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

      {/* Core Groups Tab Content */}
      {activeTab === "coreGroups" && !isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreGroups.map((group) => (
            <div
              key={group._id}
              onClick={() => handleGroupClick(group)}
              className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-blue-400"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-700">
                  {group.name}
                </h2>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {group.coreMembers.length} Members
                </span>
              </div>

              {/* CGCs Badge */}
              {group.cgc && group.cgc.length > 0 && (
                <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
                  <p className="text-sm font-bold text-green-800 mb-2 flex items-center">
                    <span className="text-lg mr-2">👑</span>
                    Leader{group.cgc.length > 1 ? "s" : ""}
                  </p>
                  <div className="pl-6 space-y-1">
                    {group.cgc.map((cgc) => (
                      <p
                        key={cgc._id}
                        className="text-sm text-green-700 font-medium"
                      >
                        {`${cgc.fname} ${cgc.lname}`}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {(group.cities.length > 0 || group.states.length > 0) && (
                <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg">
                  <p className="text-sm font-bold text-purple-800 mb-1 flex items-center">
                    <span className="text-lg mr-2">📍</span>
                    Location
                  </p>
                  <p className="text-sm text-purple-700 font-medium pl-6">
                    {[...group.cities, ...group.states].join(", ")}
                  </p>
                  {group.countries.length > 0 && (
                    <p className="text-xs text-purple-600 pl-6 mt-1">
                      {group.countries.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Core Members Preview */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <span className="text-lg mr-2">👥</span>
                  Members Preview
                </p>
                <div className="pl-6 space-y-1">
                  {group.coreMembers.slice(0, 3).map((member) => (
                    <p key={member._id} className="text-sm text-gray-600">
                      • {`${member.fname} ${member.lname}`}
                    </p>
                  ))}
                  {group.coreMembers.length > 3 && (
                    <p className="text-sm text-blue-600 font-semibold">
                      +{group.coreMembers.length - 3} more members
                    </p>
                  )}
                </div>
              </div>

              {/* Click hint */}
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-500 italic">
                  Click to view all members
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Data Case */}
      {!isLoading &&
        !error &&
        activeTab === "communities" &&
        communities.length === 0 && (
          <p className="text-center text-gray-600">No communities found.</p>
        )}
      {!isLoading &&
        !error &&
        activeTab === "coreGroups" &&
        coreGroups.length === 0 && (
          <p className="text-center text-gray-600">No core groups found.</p>
        )}

      {/* Modal for Core Group Members */}
      {showModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[75vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-0.5">
                  {selectedGroup.name}
                </h2>
                <p className="text-blue-100 text-xs">
                  {selectedGroup.coreMembers.length} Total Members
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-4">
              {/* Leaders Section */}
              {selectedGroup.cgc && selectedGroup.cgc.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-1.5">👑</span>
                    <h3 className="text-sm font-bold text-green-800">
                      Leader{selectedGroup.cgc.length > 1 ? "s" : ""}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedGroup.cgc.map((cgc) => (
                      <div
                        key={cgc._id}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-2.5 rounded-lg"
                      >
                        <p className="font-semibold text-green-900 text-sm">
                          {`${cgc.fname} ${cgc.lname}`}
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Group Leader
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Section */}
              {(selectedGroup.cities.length > 0 ||
                selectedGroup.states.length > 0) && (
                <div className="mb-4 p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg">
                  <div className="flex items-center mb-1.5">
                    <span className="text-base mr-1.5">📍</span>
                    <h3 className="text-sm font-bold text-purple-800">
                      Location
                    </h3>
                  </div>
                  <p className="text-purple-700 font-medium text-sm">
                    {[...selectedGroup.cities, ...selectedGroup.states].join(
                      ", "
                    )}
                  </p>
                  {selectedGroup.countries.length > 0 && (
                    <p className="text-xs text-purple-600 mt-0.5">
                      {selectedGroup.countries.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* All Members Section */}
              <div>
                <div className="flex items-center mb-2.5">
                  <span className="text-lg mr-1.5">👥</span>
                  <h3 className="text-sm font-bold text-gray-800">
                    All Core Members
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedGroup.coreMembers.map((member, index) => (
                    <div
                      key={member._id}
                      className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg hover:bg-gray-100 hover:border-blue-300 transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2 text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {`${member.fname} ${member.lname}`}
                          </p>
                          <p className="text-xs text-gray-600">Core Member</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-3 flex justify-between border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                  handleEditCGCPositions(e as any, selectedGroup);
                }}
                className="bg-green-600 text-white px-5 py-1.5 rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold text-sm"
              >
                Edit CGC Positions
              </button>
              <button
                onClick={closeModal}
                className="bg-blue-600 text-white px-5 py-1.5 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CGC Position Assignment Modal */}
      {showCGCModal && selectedGroup && (
        <CGCPositionModal
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          coreMembers={selectedGroup.coreMembers}
          isOpen={showCGCModal}
          onClose={closeCGCModal}
          onSuccess={handleCGCPositionSuccess}
        />
      )}
    </div>
  );
};

export default CommunityCore;

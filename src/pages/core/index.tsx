import React, { useState, useEffect } from "react";
import api from "../../api/api"; // Custom Axios instance
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useVisibility } from "../../context/VisibilityContext";
import { FaTrash } from "react-icons/fa"; // Import trash icon from react-icons

interface Member {
  _id?: string;
  role?: string;
  fname: string;
  lname: string;
  email: string;
  mobile: string | number;
  region: string;
}

interface Region {
  _id: string;
  regionName: string;
}

const CommunityMemberList: React.FC = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [members, setMembers] = useState<Member[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [popupType, setPopupType] = useState<"add" | "update" | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedTab, setSelectedTab] = useState<"dashboard" | "users" | "community" | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    fetchMembers();
    fetchRegions();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get("/core-members");
      setMembers(response.data.data);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to fetch members", { position: "top-center" });
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await api.get("/regions/getallregions");
      setRegions(response.data.data);
    } catch (error) {
      console.error("Error fetching regions:", error);
      toast.error("Failed to fetch regions", { position: "top-center" });
    }
  };

  const validateRealTime = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z]+$/;
    const mobileRegex = /^\d{10}$/;

    if (currentMember?.fname && !nameRegex.test(currentMember.fname)) {
      newErrors.fname = "First Name should contain only letters";
    }

    if (currentMember?.lname && !nameRegex.test(currentMember.lname)) {
      newErrors.lname = "Last Name should contain only letters";
    }

    if (currentMember?.email && !emailRegex.test(currentMember.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (currentMember?.mobile && !mobileRegex.test(String(currentMember.mobile))) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
  
    if (!currentMember?.fname) {
      newErrors.fname = "First Name is required";
    }
  
    if (!currentMember?.lname) {
      newErrors.lname = "Last Name is required";
    }
  
    if (!currentMember?.email) {
      newErrors.email = "Email is required";
    }
  
    if (!currentMember?.mobile) {
      newErrors.mobile = "Mobile number is required";
    }
  
    if (!currentMember?.region) {
      newErrors.region = "Region is required";
    }
  
    // Normalize mobile and email before checking duplicates
    const normalizedMobile = String(currentMember?.mobile).trim();
    const normalizedEmail = currentMember?.email?.toLowerCase().trim();
  
    if (popupType === "add") {
      if (members.some((m) => m.email?.toLowerCase().trim() === normalizedEmail)) {
        newErrors.email = "Email already exists";
      }
  
      if (members.some((m) => String(m.mobile).trim() === normalizedMobile)) {
        newErrors.mobile = "Mobile number already exists";
      }
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (currentMember) {
      setCurrentMember({ ...currentMember, [name]: value });
    }
  };

  useEffect(() => {
    if (currentMember) {
      validateRealTime();
    }
  }, [currentMember]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (currentMember) {
      setCurrentMember({ ...currentMember, region: e.target.value });
    }
  };

  const handleAddMember = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post("/core-members/add", currentMember);
      if (response.data?.success) {
        setMembers([...members, response.data.data]);
        setOpen(false);
        setCurrentMember(null);
        toast.success("Member successfully added!", {
          position: "top-center",
          autoClose: 2000,
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to add member.";
      toast.error(errorMessage, { position: "top-center", autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await api.put(`/core-members/${currentMember?._id}`, currentMember);
      if (response.data.success) {
        setMembers(members.map((m) => (m._id === currentMember?._id ? response.data.data : m)));
        setOpen(false);
        toast.success("Member successfully updated!", { position: "top-center", autoClose: 2000 });
      }
    } catch (error) {
      toast.error("Failed to update member.", { position: "top-center", autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!currentMember?._id) return;

    setIsSubmitting(true);
    try {
      await api.delete(`/core-members/${currentMember._id}`);
      setMembers(members.filter((m) => m._id !== currentMember._id));
      setOpen(false);
      setShowDeleteConfirm(false);
      toast.success("Member successfully deleted!", { position: "top-center", autoClose: 2000 });
    } catch (error) {
      toast.error("Failed to delete member.", { position: "top-center", autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Mobile", "Region"];
    const rows = members.map((m) => [m.fname, m.lname, m.email, m.mobile, m.region]);
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "community_members.csv");
    document.body.appendChild(link);
    link.click();
  };

  useEffect(() => {
    setSidebarAndHeaderVisibility(!open);
  }, [open, setSidebarAndHeaderVisibility]);

  return (
    <div className="p-4 sm:p-8">
      {/* Search & Add Button */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full sm:w-2/3 p-2 border border-gray-300 rounded-md mb-4 sm:mb-0"
        />
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
        >
          Download CSV Report
        </button>
        <button
          onClick={() => {
            setPopupType("add");
            setCurrentMember({ fname: "", lname: "", email: "", mobile: "", region: "" });
            setOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add Core Member
        </button>
      </div>

      {/* Members Table */}
      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2 text-left">Name</th>
            <th className="border px-4 py-2 text-left">Email</th>
            <th className="border px-4 py-2 text-left">Mobile</th>
            <th className="border px-4 py-2 text-left">Region</th>
            <th className="border px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members
            .filter((m) =>
              `${m.fname} ${m.lname} ${m.email} ${m.mobile} ${m.region}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            )
            .map((member) => (
              <tr key={member._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{`${member.fname} ${member.lname}`}</td>
                <td className="border px-4 py-2">{member.email}</td>
                <td className="border px-4 py-2">{member.mobile}</td>
                <td className="border px-4 py-2">{member.region}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setSelectedTab("dashboard");
                    }}
                    className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setPopupType("update");
                      setCurrentMember({ ...member });
                      setOpen(true);
                    }}
                    className="px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Tabbed Interface */}
      {selectedMember && (
        <div className="mt-6">
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setSelectedTab("dashboard")}
              className={`px-4 py-2 ${selectedTab === "dashboard" ? "border-b-2 border-blue-500" : ""}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setSelectedTab("users")}
              className={`px-4 py-2 ${selectedTab === "users" ? "border-b-2 border-blue-500" : ""}`}
            >
              Users
            </button>
            <button
              onClick={() => setSelectedTab("community")}
              className={`px-4 py-2 ${selectedTab === "community" ? "border-b-2 border-blue-500" : ""}`}
            >
              Community
            </button>
          </div>
          <div className="mt-4">
            {selectedTab === "dashboard" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Dashboard for {selectedMember.fname} {selectedMember.lname}
                </h2>
                {/* Dashboard content */}
              </div>
            )}
            {selectedTab === "users" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Users for {selectedMember.fname} {selectedMember.lname}
                </h2>
                {/* Users content */}
              </div>
            )}
            {selectedTab === "community" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Community for {selectedMember.fname} {selectedMember.lname}
                </h2>
                {/* Community content */}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Update Popup Dialog */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative">
            <h2 className="text-xl font-semibold text-center mb-4">
              {popupType === "add" ? "Add Core Member" : "Update Core Member"}
            </h2>

            <div className="space-y-3">
              {[
                { name: "fname", label: "First Name" },
                { name: "lname", label: "Last Name" },
                { name: "email", label: "Email" },
                { name: "mobile", label: "Mobile" },
              ].map((field) => (
                <div key={field.name}>
                <input
                  type="text"
                  name={field.name}
                  placeholder={field.label}
                  value={currentMember?.[field.name as keyof Member] || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors[field.name] && <p className="text-red-500 text-sm">{errors[field.name]}</p>}
              </div>
              
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={currentMember?.region || ""}
                  onChange={handleRegionChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a region</option>
                  {regions.map((region) => (
                    <option key={region._id} value={region.regionName}>
                      {region.regionName}
                    </option>
                  ))}
                </select>
                {errors.region && <p className="text-red-500 text-sm">{errors.region}</p>}
              </div>

              {currentMember?.region && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Selected Region: <span className="font-medium">{currentMember.region}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              {popupType === "add" ? (
                <button
                  onClick={handleAddMember}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </button>
              ) : (
                <button
                  onClick={handleUpdateMember}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-yellow-300"
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>
              )}
            </div>

            {popupType === "update" && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                title="Delete Member"
              >
                <FaTrash size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && currentMember && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-xl font-semibold text-center mb-4">Confirm Delete</h2>
            <p className="text-center mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold">{`${currentMember.fname} ${currentMember.lname}`}</span>?
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                No
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300"
              >
                {isSubmitting ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover/>
    </div>
  );
};

export default CommunityMemberList;
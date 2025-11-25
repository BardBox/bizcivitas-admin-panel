import { useEffect, useState } from "react";
import api from "../../api/api"; // Import API instance
import {  FiTrash2, FiPlus } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select"; // Import react-select
import {  City } from "country-state-city"; // Import country-state-city

// Updated Interface based on API response
interface Region {
  _id: string;
  regionName: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const RegionManagement = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [regionToDelete, setRegionToDelete] = useState<Region | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // State for dropdowns
  const [selectedCity, setSelectedCity] = useState<{ value: string; label: string } | null>(null);
  const [selectedState] = useState<{ value: string; label: string }>({
    value: "GJ", // ISO code for Gujarat
    label: "Gujarat",
  });
  const [selectedCountry] = useState<{ value: string; label: string }>({
    value: "IN", // ISO code for India
    label: "India",
  });

  // Options for dropdowns
  const cityOptions = City.getCitiesOfState("IN", "GJ").map(city => ({
    value: city.name,
    label: city.name,
  }));

  useEffect(() => {
    fetchRegions();
  }, []);

  // 🔹 Fetch all regions
  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/regions/getallregions");
      setRegions(response.data.data);
    } catch (err) {
      setError("Failed to load regions.");
      toast.error("Failed to load regions", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Open Modal for Add
  const openModal = () => {
    setIsModalOpen(true);
  };

  // 🔹 Handle Add
  const handleSubmit = async () => {
    if (!selectedCity) {
      toast.error("Please select a city", { position: "top-center" });
      return;
    }

    // Check for unique city name
    const isCityAlreadyUsed = regions.some(region => region.regionName === selectedCity?.label);
    if (isCityAlreadyUsed) {
      toast.error("This city is already added. Please select another city.", { position: "top-center" });
      return;
    }

    try {
      const regionName = selectedCity.label;
      await api.post("/regions/create", {
        regionName,
        city: selectedCity.value,
        state: selectedState.value,
        country: selectedCountry.value,
      });
      toast.success("Region added successfully!", { position: "top-center" });
      fetchRegions();
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Error saving region", { position: "top-center" });
    }
  };

  // 🔹 Handle Delete
  const handleDelete = async () => {
    if (!regionToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/regions/delete/${regionToDelete._id}`);
      toast.success("Region deleted successfully!", { position: "top-center" });
      fetchRegions();
      setShowDeleteConfirm(false);
      setRegionToDelete(null);
    } catch (err) {
      toast.error("Error deleting region", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  // 🔹 Open Delete Confirmation
  const confirmDelete = (region: Region) => {
    setRegionToDelete(region);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg w-full max-w-2xl mx-auto">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> Add Region
        </button>
      </div>

      {/* 🔹 Loading & Error Handling */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          {/* <Loader /> */}
        </div>
      )}
      {error && !loading && <p className="text-center text-red-600">{error}</p>}

      {/* 🔹 Region List */}
      {!loading && regions.length > 0 && (
        <ul className="space-y-3">
          {regions.map((region) => (
            <li
              key={region._id}
              className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-sm"
            >
              <span className="text-gray-800">{region.regionName}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmDelete(region)}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  <FiTrash2 />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 No Regions Found */}
      {!loading && regions.length === 0 && (
        <p className="text-center text-gray-600">No regions found.</p>
      )}

      {/* 🔹 Modal for Add */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Add New Region</h3>

            {/* Dropdown for Country */}
            <Select
              value={selectedCountry}
              options={[selectedCountry]} // Only show India
              placeholder="Select Country"
              isDisabled
              className="mb-4"
            />

            {/* Dropdown for State */}
            <Select
              value={selectedState}
              options={[selectedState]} // Only show Gujarat
              placeholder="Select State"
              isDisabled
              className="mb-4"
            />

            {/* Dropdown for City */}
            <Select
              value={selectedCity}
              onChange={(option) => setSelectedCity(option)}
              options={cityOptions}
              placeholder="Select City"
              className="mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Delete Confirmation Popup */}
      {showDeleteConfirm && regionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">Confirm Delete</h3>
            <p className="text-center mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold">{regionToDelete.regionName}</span>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:bg-red-300"
              >
                {isDeleting ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover/>
    </div>
  );
};

export default RegionManagement;

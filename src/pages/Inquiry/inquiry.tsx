import { useEffect, useState } from "react";
import api from "../../api/api"; // Import API instance
import { FiTrash2 } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Interface for Inquiry based on API response
interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  howDidYouFindUs?: string;
}

const InquiryManagement = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  // 🔹 Fetch all inquiries
  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get("/inquiry");
      setInquiries(response.data.data);
    } catch (err) {
      setError("Failed to load inquiries.");
      toast.error("Failed to load inquiries", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle Delete
  const handleDelete = async () => {
    if (!inquiryToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/inquiry/${inquiryToDelete._id}`);
      toast.success("Inquiry deleted successfully!", { position: "top-center" });
      fetchInquiries();
      setShowDeleteConfirm(false);
      setInquiryToDelete(null);
    } catch (err) {
      toast.error("Error deleting inquiry", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  // 🔹 Open Delete Confirmation
  const confirmDelete = (inquiry: Inquiry) => {
    setInquiryToDelete(inquiry);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-6 rounded-lg w-full max-w-5xl mx-auto">
      {/* <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Inquiry Management</h2>
      </div> */}

      {/* 🔹 Loading & Error Handling */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <p>Loading...</p>
        </div>
      )}
      {error && !loading && <p className="text-center text-red-600">{error}</p>}

      {/* 🔹 Inquiry List */}
      {!loading && inquiries.length > 0 && (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry._id}
              className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-lg"
            >
              <div className="flex flex-col">
                <span className="text-gray-800 font-medium">{inquiry.name || "N/A"}</span>
                <span className="text-gray-600 text-sm">{inquiry.email || "N/A"}</span>
                <span className="text-gray-600 text-sm">
                  {inquiry.phoneNumber || "No phone number"}
                </span>
                <span className="text-gray-600 text-sm">
                  {inquiry.howDidYouFindUs || "No source provided"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmDelete(inquiry)}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  <FiTrash2 />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 No Inquiries Found */}
      {!loading && inquiries.length === 0 && (
        <p className="text-center text-gray-600">No inquiries found.</p>
      )}

      {/* 🔹 Delete Confirmation Popup */}
      {showDeleteConfirm && inquiryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">Confirm Delete</h3>
            <p className="text-center mb-6">
              Are you sure you want to delete inquiry from{" "}
              <span className="font-bold">{inquiryToDelete.name || "N/A"}</span>?
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
    </div>
  );
};

export default InquiryManagement;
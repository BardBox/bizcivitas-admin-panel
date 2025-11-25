import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { toast } from "react-toastify";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

// Types
interface JoinRequest {
  _id: string;
  user: {
    fname: string;
    lname: string;
    email: string;
    mobile?: string | number;
  };
  status: "pending" | "approved" | "rejected";
  adminRemarks?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  decidedAt?: string | null;
}

interface EventData {
  _id: string;
  name: string;
  date: string;
  totalRequests: number;
}

interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
}

const JoinRequests = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [remarks, setRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch requests
  useEffect(() => {
    const fetchJoinRequests = async () => {
      try {
        const res = await api.get<
          ApiResponse<{ event: EventData; requests: JoinRequest[] }>
        >(`/eventjoin/event/${eventId}`);
        if (res.data.statusCode === 200) {
          setRequests(res.data.data.requests);
          setEventData(res.data.data.event);
        } else {
          toast.error(res.data.message || "Failed to fetch join requests");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Error loading join requests");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJoinRequests();
  }, [eventId]);

  // Approve request
  const handleApprove = async () => {
    if (!selectedRequestId) return;
    try {
      const res = await api.put<ApiResponse<JoinRequest>>(
        `/eventjoin/${selectedRequestId}`,
        { status: "approved", adminRemarks: remarks || null }
      );
      if (res.data.statusCode === 200) {
        toast.success("Request approved successfully!");
        setRequests((prev) =>
          prev.map((req) =>
            req._id === selectedRequestId
              ? { ...req, status: "approved", adminRemarks: remarks }
              : req
          )
        );
        setShowApproveModal(false);
        setRemarks("");
      } else {
        toast.error(res.data.message || "Failed to approve request");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error approving request");
    }
  };

  // Reject request
  const handleReject = async () => {
    if (!selectedRequestId) return;
    try {
      const res = await api.put<ApiResponse<JoinRequest>>(
        `/eventjoin/${selectedRequestId}`,
        { status: "rejected", rejectionReason: rejectionReason || null }
      );
      if (res.data.statusCode === 200) {
        toast.success("Request rejected successfully!");
        setRequests((prev) =>
          prev.map((req) =>
            req._id === selectedRequestId
              ? { ...req, status: "rejected", rejectionReason }
              : req
          )
        );
        setShowRejectModal(false);
        setRejectionReason("");
      } else {
        toast.error(res.data.message || "Failed to reject request");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error rejecting request");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading join requests...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Join Requests</h1>
          {eventData && (
            <p className="text-gray-600">
              Event: <span className="font-medium">{eventData.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Back
        </button>
      </div>

      {/* Table */}
      {requests.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Email", "Mobile", "Requested On", "Status", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req._id}>
                  <td className="py-3 px-4">
                    {req.user.fname} {req.user.lname}
                  </td>
                  <td className="py-3 px-4">{req.user.email}</td>
                  <td className="py-3 px-4">{req.user.mobile || "N/A"}</td>
                  <td className="py-3 px-4">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : req.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {req.status === "pending" && <Clock className="w-4 h-4 mr-1" />}
                      {req.status === "approved" && (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                      )}
                      {req.status === "rejected" && (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      {req.status}
                    </span>
                    {req.adminRemarks && (
                      <div className="text-xs text-gray-500 mt-1">
                        Remarks: {req.adminRemarks}
                      </div>
                    )}
                    {req.rejectionReason && (
                      <div className="text-xs text-red-500 mt-1">
                        Reason: {req.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {req.status === "pending" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequestId(req._id);
                            setShowApproveModal(true);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequestId(req._id);
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-6">No join requests found.</p>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Approve Request</h2>
            <textarea
              placeholder="Add admin remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border p-2 rounded mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Reject Request</h2>
            <textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border p-2 rounded mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinRequests;

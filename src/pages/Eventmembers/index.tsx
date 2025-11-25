
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { toast } from "react-toastify";
import { ChevronLeft, CheckCircle, XCircle, Check, X } from "lucide-react";

interface Participant {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  mobile: string | number | null;
  paymentStatus: string;
  amountPaid: number;
  attendance: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface JoinRequest {
  _id: string;
  requestId?: string;
  fname: string;
  lname: string;
  email: string;
  mobile: string | number | null;
  createdAt: string;
  userId: string;
  paymentStatus?: string;
  amountPaid?: number;
  attendance?: boolean;
  approvedByAdmin?: boolean;
}

interface EventData {
  _id: string;
  eventName: string;
  isPaid: boolean;
  participants?: Participant[];
  pendingParticipants?: Participant[];
  approvedByAdmin?: Participant[];
  joinRequests?: JoinRequest[];
  pending?: JoinRequest[];
  totalParticipants?: number;
  totalPending?: number;
  totalJoinRequests?: number;
  membershipAccessType?: { membership: string; type: string; _id: string }[];
}

const EventMembers = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"participants" | "approved" | "pending" | "requests">("participants");
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEventParticipants = async () => {
      try {
        const response = await api.get(`/events/event/${eventId}`);
        if (response.data.success && response.data.data) {
          setEvent({
            ...response.data.data,
            participants: response.data.data.participants ?? [],
            approvedByAdmin: response.data.data.approvedByAdmin ?? [],
            pendingParticipants: response.data.data.pendingParticipants ?? [],
            joinRequests: response.data.data.joinRequests ?? [],
            pending: response.data.data.pending ?? [],
            totalJoinRequests: (response.data.data.joinRequests?.length || 0) + (response.data.data.pending?.length || 0),
          });
        } else {
          toast.error(response.data.message || "Event not found");
        }
      } catch (error: any) {
        console.error("Error fetching participants:", error);
        toast.error(error.response?.data?.message || "Failed to load event");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventParticipants();
  }, [eventId]);

  const handleApproveRequest = async (requestId: string) => {
    const approveKey = `approve-${requestId}`;
    setLoadingRequests((prev) => new Set(prev).add(approveKey));
    try {
      const response = await api.put(`/eventjoin/${requestId}`, {
        status: "approved",
        adminRemarks: "Welcome to the event!",
      });
      if (response.data.success) {
        toast.success("Join request approved successfully");
        setEvent((prev) => {
          if (!prev) return prev;
          const updatedRequests = [
            ...(prev.joinRequests?.filter((req) => req.requestId !== requestId && req._id !== requestId) || []),
            ...(prev.pending?.filter((req) => req.requestId !== requestId && req._id !== requestId) || []),
          ];
          return {
            ...prev,
            joinRequests: prev.joinRequests?.filter((req) => req.requestId !== requestId && req._id !== requestId) || [],
            pending: prev.pending?.filter((req) => req.requestId !== requestId && req._id !== requestId) || [],
            totalJoinRequests: updatedRequests.length,
          };
        });
      } else {
        toast.error(response.data.message || "Failed to approve join request");
      }
    } catch (error: any) {
      console.error("Error approving join request:", error);
      toast.error(error.response?.data?.message || "Failed to approve join request");
    } finally {
      setLoadingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(approveKey);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const rejectKey = `reject-${requestId}`;
    setLoadingRequests((prev) => new Set(prev).add(rejectKey));
    try {
      const response = await api.put(`/eventjoin/${requestId}`, {
        status: "rejected",
        adminRemarks: "Join request rejected",
        rejectionReason: "No reason provided",
      });
      if (response.data.success) {
        toast.success("Join request rejected successfully");
        setEvent((prev) => {
          if (!prev) return prev;
          const updatedRequests = [
            ...(prev.joinRequests?.filter((req) => req.requestId !== requestId && req._id !== requestId) || []),
            ...(prev.pending?.filter((req) => req.requestId !== requestId && req._id !== requestId) || []),
          ];
          return {
            ...prev,
            joinRequests: prev.joinRequests?.filter((req) => req.requestId !== requestId && req._id !== requestId) || [],
            pending: prev.pending?.filter((req) => req.requestId !== requestId && req._id !== requestId) || [],
            totalJoinRequests: updatedRequests.length,
          };
        });
      } else {
        toast.error(response.data.message || "Failed to reject join request");
      }
    } catch (error: any) {
      console.error("Error rejecting join request:", error);
      toast.error(error.response?.data?.message || "Failed to reject join request");
    } finally {
      setLoadingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rejectKey);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg font-medium text-gray-600">Loading participants...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 text-center text-gray-500">No event found</div>
    );
  }

  const renderParticipantTable = (participants: Participant[] | undefined, title: string) => (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      {participants && participants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Mobile</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Payment Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Amount Paid</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {participants.map((participant) => (
                <tr key={participant._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{`${participant.fname} ${participant.lname}`}</td>
                  <td className="py-3 px-4 text-sm">{participant.email}</td>
                  <td className="py-3 px-4 text-sm">{participant.mobile || "Not provided"}</td>
                  <td className="py-3 px-4 text-sm capitalize">{participant.paymentStatus}</td>
                  <td className="py-3 px-4 text-sm">
                    {event.isPaid && participant.paymentStatus !== "free"
                      ? `₹${participant.amountPaid}`
                      : "Free"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {participant.attendance ? (
                      <span className="flex items-center text-green-500">
                        <CheckCircle size={16} className="mr-1" /> Present
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500">
                        <XCircle size={16} className="mr-1" /> Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No {title.toLowerCase()} found.</p>
      )}
    </div>
  );

  const renderJoinRequestsTable = (requests: JoinRequest[] | undefined, pending: JoinRequest[] | undefined) => {
    const combinedRequests = [...(requests || []), ...(pending || [])];
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Requests</h2>
        {combinedRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Mobile</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Payment Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Amount Paid</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {combinedRequests.map((request) => (
                  <tr key={request.requestId || request._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{`${request.fname} ${request.lname}`}</td>
                    <td className="py-3 px-4 text-sm">{request.email}</td>
                    <td className="py-3 px-4 text-sm">{request.mobile || "Not provided"}</td>
                    <td className="py-3 px-4 text-sm capitalize">{request.paymentStatus || "N/A"}</td>
                    <td className="py-3 px-4 text-sm">
                      {event.isPaid && request.paymentStatus !== "free"
                        ? `₹${request.amountPaid || 0}`
                        : "Free"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.requestId || request._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                          disabled={loadingRequests.has(`approve-${request.requestId || request._id}`)}
                        >
                          {loadingRequests.has(`approve-${request.requestId || request._id}`) ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin h-4 w-4 mr-2 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Loading
                            </span>
                          ) : (
                            <>
                              <Check size={16} className="mr-1" /> Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.requestId || request._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center disabled:opacity-50"
                          disabled={loadingRequests.has(`reject-${request.requestId || request._id}`)}
                        >
                          {loadingRequests.has(`reject-${request.requestId || request._id}`) ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin h-4 w-4 mr-2 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Loading
                            </span>
                          ) : (
                            <>
                              <X size={16} className="mr-1" /> Reject
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No join requests or pending users found.</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
      >
        <ChevronLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{event.eventName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Total Participants: {event.totalParticipants || event.participants?.length || 0} | 
          Total Pending: {event.totalPending || event.pendingParticipants?.length || 0} | 
          Total Join Requests: {event.totalJoinRequests || (event.joinRequests?.length || 0) + (event.pending?.length || 0)}
        </p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "participants" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveTab("participants")}
        >
          Participants ({event.participants?.length || 0})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "approved" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved by Admin ({event.approvedByAdmin?.length || 0})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "pending" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({event.pendingParticipants?.length || 0})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "requests" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveTab("requests")}
        >
          Join Requests ({(event.joinRequests?.length || 0) + (event.pending?.length || 0)})
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === "participants" &&
          renderParticipantTable(event.participants, "Participants")}
        {activeTab === "approved" &&
          renderParticipantTable(event.approvedByAdmin, "Approved Participants")}
        {activeTab === "pending" &&
          renderParticipantTable(event.pendingParticipants, "Pending Participants")}
        {activeTab === "requests" &&
          renderJoinRequestsTable(event.joinRequests, event.pending)}
      </div>
    </div>
  );
};

export default EventMembers;

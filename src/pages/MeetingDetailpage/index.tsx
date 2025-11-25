import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiClock, FiUsers } from "react-icons/fi";
import { useVisibility } from "../../context/VisibilityContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";

// Interfaces based on the latest API response
interface InvitedUser {
  _id?: string;
  email: string;
  visitorName: string;
  businessCategory?: string;
  businessSubcategory?: string;
  mobile: string | number;
  amount?: number;
  status?: string;
}

interface Target {
  _id?: string;
  targetId: string;
  targetType: "Community" | "CoreGroup";
  name?: string;
  totalMembers?: number;
}

interface AllVisitor {
  _id?: string;
  visitorName: string;
  email: string;
  mobile: string | number;
  source: string;
  fname: string;
  lname: string;
  meetingId: string;
  businessCategory?: string;
  businessSubcategory?: string;
}

interface RegisteredUser {
  _id?: string;
  visitorName: string;
  email: string;
  mobile: string | number;
  source: string;
  fname: string;
  lname: string;
  meetingId: string;
}

interface Meeting {
  _id: string;
  title: string;
  visitor: string;
  speaker: string;
  targets: Target[];
  date: string;
  place: string;
  time: string;
  img: string;
  agenda: string;
  visitorFee: number;
  attendees: any[];
  invited: InvitedUser[];
  invitedUsers: InvitedUser[];
  allVisitors: AllVisitor[];
  registeredUsers: RegisteredUser[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const MeetingDetailsPage = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'invited' | 'all-visitors' | 'registered'>('overview');

  useEffect(() => {
    setSidebarAndHeaderVisibility(true);
  }, [setSidebarAndHeaderVisibility]);

  useEffect(() => {
    if (!id) {
      setError("No meeting ID provided.");
      setLoading(false);
      return;
    }

    const fetchMeeting = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/meetings/${id}`);
        if (response.data.success) {
          setMeeting(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch meeting.");
        }
      } catch (err: any) {
        console.error("Fetch meeting error:", err);
        setError(err.response?.data?.message || "Failed to fetch meeting details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [id]);

  const handleEdit = () => {
    if (meeting) {
      navigate(`/meetings/edit/${meeting._id}`);
    }
  };

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  const confirmDeleteMeeting = async () => {
    if (!meeting?._id) return;

    try {
      const response = await api.delete(`/meetings/${meeting._id}`);
      if (response.data.success) {
        toast.success("Meeting deleted successfully.", { autoClose: 2000 });
        navigate("/meetings");
      } else {
        toast.error(response.data.message || "Failed to delete meeting.");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete meeting.");
    } finally {
      setConfirmDelete(false);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    return time || "N/A";
  };

  const invitedGuests = meeting?.invitedUsers?.length ? meeting.invitedUsers : meeting?.invited || [];
  const confirmedAttendees = invitedGuests.filter(guest => guest.status === 'confirmed') || [];
  const allVisitors = meeting?.allVisitors || [];
  const registeredUsers = meeting?.registeredUsers || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-600 text-lg mb-4">{error || "Meeting not found."}</p>
          <button
            onClick={() => navigate("/meetings")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/meetings")}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition duration-300"
        >
          <FiArrowLeft size={24} /> <span className="text-lg font-medium">Back to Meetings</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            <FiUser size={18} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition duration-300"
          >
            <FiUser size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Meeting Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        {/* Image */}
        {meeting.img && (
          <img
            src={`${import.meta.env.VITE_API_BASE_URL}/image/${meeting.img}`}
            alt={meeting.title}
            className="w-full h-64 object-cover rounded-t-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x300?text=No+Image";
            }}
          />
        )}
        
        {/* Title and Details */}
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">{meeting.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
            <span className="flex items-center gap-2">
              <FiMapPin size={20} /> {meeting.place}
            </span>
            <span className="flex items-center gap-2">
              <FiCalendar size={20} /> {formatDate(meeting.date)}
            </span>
            <span className="flex items-center gap-2">
              <FiClock size={20} /> {formatTime(meeting.time)}
            </span>
          </div>
          
          {/* Core Group */}
          {meeting.targets[0]?.name && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <FiUsers className="mr-2" /> 
                {meeting.targets[0].name} ({meeting.targets[0].targetType}, {meeting.targets[0].totalMembers} Members)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        {(['overview', 'invited', 'all-visitors', 'registered'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-sm font-semibold transition duration-300 whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'border-b-2 border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-200'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'invited' && `Invited Users (${invitedGuests.length})`}
            {tab === 'all-visitors' && `All Visitors (${allVisitors.length})`}
            {tab === 'registered' && `Registered Users (${registeredUsers.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-blue-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{meeting.visitor}</div>
                <div className="text-sm text-gray-500 mt-2">Visitor Capacity</div>
              </div>
              <div className="p-6 bg-green-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{meeting.speaker}</div>
                <div className="text-sm text-gray-500 mt-2">Speakers</div>
              </div>
              <div className="p-6 bg-purple-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">{confirmedAttendees.length}</div>
                <div className="text-sm text-gray-500 mt-2">Confirmed Attendees</div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Visitor Fee</h3>
                <p className="text-2xl font-bold text-green-600">₹{meeting.visitorFee}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Agenda</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{meeting.agenda}</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span> {new Date(meeting.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(meeting.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'invited' && (
          <div className="overflow-x-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Invited Users ({invitedGuests.length})</h3>
            {invitedGuests.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategory</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitedGuests.map((guest, index) => (
                    <tr key={guest._id || index} className="hover:bg-gray-50 transition duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FiUser className="h-10 w-10 text-gray-300" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{guest.visitorName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiMail className="mr-2 text-gray-400" />
                          {guest.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiPhone className="mr-2 text-gray-400" />
                          {guest.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {guest.businessCategory || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {guest.businessSubcategory || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{guest.amount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          guest.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : guest.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {guest.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-8 text-lg">No invited users found.</p>
            )}
          </div>
        )}

        {activeTab === 'all-visitors' && (
          <div className="overflow-x-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">All Visitors ({allVisitors.length})</h3>
            {allVisitors.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allVisitors.map((visitor, index) => (
                    <tr key={visitor._id || index} className="hover:bg-gray-50 transition duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FiUser className="h-10 w-10 text-gray-300" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{visitor.visitorName}</div>
                            <div className="text-sm text-gray-500">{visitor.fname} {visitor.lname}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiMail className="mr-2 text-gray-400" />
                          {visitor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiPhone className="mr-2 text-gray-400" />
                          {visitor.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visitor.businessCategory || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          visitor.source === 'registered' 
                            ? 'bg-blue-100 text-blue-800' 
                            : visitor.source === 'invited'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {visitor.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-8 text-lg">No visitors found.</p>
            )}
          </div>
        )}

        {activeTab === 'registered' && (
          <div className="overflow-x-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Registered Users ({registeredUsers.length})</h3>
            {registeredUsers.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registeredUsers.map((user, index) => (
                    <tr key={user._id || index} className="hover:bg-gray-50 transition duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FiUser className="h-10 w-10 text-gray-300" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.visitorName}</div>
                            <div className="text-sm text-gray-500">{user.fname} {user.lname}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiMail className="mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiPhone className="mr-2 text-gray-400" />
                          {user.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.source === 'registered' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-8 text-lg">No registered users found.</p>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-8">
              <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete "<strong>{meeting.title}</strong>"? This action cannot be undone.</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={cancelDelete}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMeeting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                >
                  Delete Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetailsPage;
import { useEffect, useState, useMemo } from "react";
import api from "../../api/api"; // Import API instance
import { FiHeart, FiMessageSquare } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useVisibility } from "../../context/VisibilityContext";

// Interfaces based on API response
interface User {
  _id?: string;
  name?: string;
  avatar?: string;
  username?: string;
  role?: string;
  fname?: string;
  lname?: string;
  id?: string;
}
interface Like {
  userId: string | User;
  _id: string;
}
interface PollOption {
  text: string;
  votes: number;
  _id: string;
}
interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  voters: string[];
  createdAt: string;
  updatedAt: string;
}
interface FeedData {
  _id: string;
  userId?: User;
  type: string;
  visibility: string;
  createdAt: string;
  mentions: any[];
  comments: any[];
  likeCount: number;
  likes: Like[];
  commentCount: number;
  communityId: string | null;
  badge: string;
  isLiked: boolean;
  timeAgo: string;
  isDailyFeed: boolean;
  title: string;
  description: string | string[];
  images?: string[];
  mediaUrls?: string[];
  mediaUrl?: string;
  image?: string;
  icon?: string;
  poll?: Poll;
}
interface Feed {
  type: string;
  data: FeedData;
}

const DailyFeed = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filter states
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(7); // Fixed items per page

  // Base URL for images
  const BASE_IMAGE_URL = "https://backend.bizcivitas.com/api/v1/image/";
  const PUBLIC_FOLDER_URL = "/"; // Base URL for public folder

  // Fallback avatar URLs
  const FALLBACK_USER_AVATAR = "https://via.placeholder.com/150?text=User";
  const FALLBACK_ADMIN_AVATAR = "https://via.placeholder.com/150?text=Admin";
  const BIZ_ADMIN_ICON_URL = `${PUBLIC_FOLDER_URL}biz-new.svg`; // Admin icon from public folder

  // Platform categories for filtering
  const bizHubTypes = useMemo(
    () => [
      "general-chatter",
      "referral-exchange",
      "business-deep-dive",
      "travel-talks",
      "biz-learnings",
      "collab-corner",
    ],
    []
  );

  const bizPulseTypes = useMemo(
    () => [
      "announcement",
      "travelStories",
      "lightPulse",
      "spotlightStories",
      "pulsePolls",
      "businessBoosters",
      "foundersDesk",
    ],
    []
  );

  useEffect(() => {
    fetchDailyFeed();
  }, []);

  useEffect(() => {
    setSidebarAndHeaderVisibility(!isModalOpen);
    return () => {
      setSidebarAndHeaderVisibility(true);
    };
  }, [isModalOpen, setSidebarAndHeaderVisibility]);

  // Memoize unique feed types for dropdown
  const availableTypes = useMemo(() => {
    if (selectedPlatform === "bizHub") {
      return bizHubTypes;
    } else if (selectedPlatform === "bizPulse") {
      return bizPulseTypes;
    } else {
      return [];
    }
  }, [selectedPlatform, bizHubTypes, bizPulseTypes]);

  // Filter feeds based on selected platform and type
  const filteredFeeds = useMemo(() => {
    let filtered = [...feeds];

    if (selectedPlatform !== "all") {
      if (selectedPlatform === "bizPulse") {
        filtered = filtered.filter(
          (feed) =>
            feed.type === "wallfeed" && bizPulseTypes.includes(feed.data.type)
        );
      } else if (selectedPlatform === "bizHub") {
        filtered = filtered.filter(
          (feed) => feed.type === "post" && bizHubTypes.includes(feed.data.type)
        );
      }
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((feed) => feed.data.type === selectedType);
    }

    return filtered;
  }, [feeds, selectedPlatform, selectedType, bizPulseTypes, bizHubTypes]);

  // Pagination calculations
  const totalItems = filteredFeeds.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFeeds = filteredFeeds.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlatform, selectedType]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Fetch daily feed
  const fetchDailyFeed = async () => {
    try {
      setLoading(true);
      const response = await api.get("/dailyfeed/");
      if (response.data.success) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data].filter(Boolean);
        const validFeeds = data.filter((feed: Feed) => feed.data?._id);

        setFeeds(validFeeds);
      } else {
        throw new Error("Failed to fetch daily feed");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load daily feed.");
      toast.error("Failed to load daily feed", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown Date";
    }
  };

  // Format type name
  const formatTypeName = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  // Get avatar URL with fallback
  const getAvatarUrl = (user?: User) => {
    if (!user || !user.avatar) {
      if (user?.role === "admin") {
        return BIZ_ADMIN_ICON_URL;
      }
      return user?.role === "core-member"
        ? FALLBACK_ADMIN_AVATAR
        : FALLBACK_USER_AVATAR;
    }
    return user.avatar.startsWith("http")
      ? user.avatar
      : `${BASE_IMAGE_URL}${user.avatar}`;
  };

  // Get description preview
  const getDescriptionPreview = (description: string | string[], poll?: Poll) => {
    if (poll) {
      return poll.question;
    }
    let content = "";
    if (Array.isArray(description)) {
      content = description[0] || "No description available.";
    } else {
      content = description || "No description available.";
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    return plainText.substring(0, 100);
  };

  // Get full description for modal
  const getFullDescription = (description: string | string[]) => {
    if (Array.isArray(description)) {
      return description.join("");
    }
    return description || "No description available.";
  };

  // Get images for modal or feed display
  const getImages = (feed: FeedData) => {
    const images = [];
    if (feed.mediaUrls && feed.mediaUrls.length > 0) {
      images.push(
        ...feed.mediaUrls.map((url) =>
          url.startsWith("http")
            ? url
            : `${BASE_IMAGE_URL}post/${url.split("/").pop()}`
        )
      );
    }
    if (feed.images && feed.images.length > 0) {
      images.push(
        ...feed.images.map((url) =>
          url.startsWith("http")
            ? url
            : `${BASE_IMAGE_URL}wallFeed/${url.split("/").pop()}`
        )
      );
    }
    if (feed.image) {
      images.push(
        feed.image.startsWith("http")
          ? feed.image
          : `${BASE_IMAGE_URL}wallFeed/${feed.image.split("/").pop()}`
      );
    }
    if (feed.mediaUrl) {
      images.push(
        feed.mediaUrl.startsWith("http")
          ? feed.mediaUrl
          : `${BASE_IMAGE_URL}post/${feed.mediaUrl.split("/").pop()}`
      );
    }
    return images;
  };

  // Open modal with feed details
  const openModal = (feed: Feed) => {
    setSelectedFeed(feed);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setSelectedFeed(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 min-h-screen w-full max-w-4xl mx-auto">
      {/* Filter Dropdowns */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <h2 className="text-2xl font-bold text-gray-800">Daily Feed</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Platform:</label>
          <select
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value);
              setSelectedType("all");
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Platforms</option>
            <option value="bizPulse">Biz Pulse</option>
            <option value="bizHub">Biz Hub</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={selectedPlatform === "all"}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
              selectedPlatform === "all"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : ""
            }`}
          >
            {selectedPlatform === "all" ? (
              <option value="all">Select Platform First</option>
            ) : (
              <>
                <option value="all">All Types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatTypeName(type)}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-600">
          {filteredFeeds.length > 0 ? (
            <>
              Showing {Math.min(startIndex + 1, filteredFeeds.length)}-
              {Math.min(endIndex, filteredFeeds.length)} of{" "}
              {filteredFeeds.length} filtered feeds
              {totalPages > 1 && (
                <span className="ml-1">
                  (Page {currentPage}/{totalPages})
                </span>
              )}
            </>
          ) : (
            `0 of ${feeds.length} feeds`
          )}
        </div>
      </div>
      {/* Loading & Error Handling */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      {error && !loading && <p className="text-center text-red-600">{error}</p>}
      {/* Feed List */}
      {!loading && currentFeeds.length > 0 && (
        <div className="space-y-4">
          {currentFeeds.map((feed) => (
            <div
              key={feed.data._id}
              onClick={() => openModal(feed)}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-4"
            >
              <img
                src={getAvatarUrl(feed.data.userId)}
                alt="User Avatar"
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    feed.data.userId?.role === "admin"
                      ? BIZ_ADMIN_ICON_URL
                      : FALLBACK_USER_AVATAR;
                }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">
                      {feed.data.userId?.name ||
                        feed.data.userId?.fname ||
                        "Unknown User"}
                    </p>
                    <span className="text-xs text-gray-500">
                      {feed.data.timeAgo || formatDate(feed.data.createdAt)}
                    </span>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                    {formatTypeName(feed.data.type)}
                  </span>
                </div>
                {feed.data.type === "pulsePolls" && feed.data.poll ? (
                  <div className="mt-2">
                    <p className="text-gray-600 text-sm font-medium">
                      {feed.data.poll.question}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {feed.data.poll.options.slice(0, 2).map((option) => (
                        <li
                          key={option._id}
                          className="text-gray-500 text-xs flex justify-between"
                        >
                          <span>{option.text}</span>
                          <span>{option.votes} votes</span>
                        </li>
                      ))}
                      {feed.data.poll.options.length > 2 && (
                        <li className="text-gray-400 text-xs">...</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {getDescriptionPreview(
                      feed.data.description,
                      feed.data.poll
                    )}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <div className="flex items-center gap-1">
                    <FiHeart className="text-red-500" />
                    <span className="text-xs">{feed.data.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiMessageSquare className="text-blue-500" />
                    <span className="text-xs">
                      {feed.data.commentCount || 0}
                    </span>
                  </div>
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                    {feed.data.badge || feed.data.type || "No Badge"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const isCurrentPage = page === currentPage;
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              if (!showPage) {
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-3 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isCurrentPage
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      )}
      {/* Pagination Info */}
      {!loading && totalItems > 0 && (
        <div className="text-center mt-4 text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
          {totalItems} feeds
          {totalPages > 1 && (
            <span className="ml-2">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </div>
      )}
      {/* No Feeds Found */}
      {!loading && filteredFeeds.length === 0 && feeds.length > 0 && (
        <p className="text-center text-gray-600">
          No feeds found matching the selected filters. Try adjusting your
          filter criteria.
        </p>
      )}
      {!loading && feeds.length === 0 && (
        <p className="text-center text-gray-600">
          No feeds found. Please try refreshing or check the API response.
        </p>
      )}
      {/* Modal for Feed Details */}
      {isModalOpen && selectedFeed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedFeed.data.title || "Untitled"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={getAvatarUrl(selectedFeed.data.userId)}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  e.currentTarget.src =
                    selectedFeed.data.userId?.role === "admin"
                      ? BIZ_ADMIN_ICON_URL
                      : FALLBACK_USER_AVATAR;
                }}
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {selectedFeed.data.userId?.name ||
                    selectedFeed.data.userId?.fname ||
                    "Unknown User"}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedFeed.data.createdAt)}
                </p>
              </div>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {selectedFeed.data.badge ||
                  selectedFeed.data.type ||
                  "No Badge"}
              </span>
            </div>
            {/* Poll Display */}
            {selectedFeed.data.type === "pulsePolls" && selectedFeed.data.poll && (
              <div className="mb-4 border border-gray-200 rounded-md p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedFeed.data.poll.question}
                </h4>
                <ul className="space-y-2">
                  {selectedFeed.data.poll.options.map((option) => (
                    <li
                      key={option._id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span className="text-gray-700">{option.text}</span>
                      <span className="text-gray-500">
                        {option.votes} votes
                        {selectedFeed.data.poll!.totalVotes > 0 &&
                          ` (${
                            Math.round(
                              (option.votes /
                                selectedFeed.data.poll!.totalVotes) *
                                100
                            ) || 0
                          }%)`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Total Votes: {selectedFeed.data.poll.totalVotes}
                </p>
              </div>
            )}
            {/* Images */}
            {getImages(selectedFeed.data).length > 0 && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                {getImages(selectedFeed.data).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Post Image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_USER_AVATAR;
                    }}
                  />
                ))}
              </div>
            )}
            {/* Description (non-poll content) */}
            {selectedFeed.data.type !== "pulsePolls" && (
              <div
                className="text-gray-600 mb-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: getFullDescription(selectedFeed.data.description),
                }}
              />
            )}
            <div className="flex items-center gap-4 border-t pt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <FiHeart className="text-red-500" />
                <span>{selectedFeed.data.likeCount || 0} Likes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FiMessageSquare className="text-blue-500" />
                <span>{selectedFeed.data.commentCount || 0} Comments</span>
              </div>
            </div>
            {selectedFeed.data.comments &&
              selectedFeed.data.comments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Comments
                  </h4>
                  <ul className="space-y-2">
                    {selectedFeed.data.comments.map((comment: any) => (
                      <li key={comment._id} className="text-sm text-gray-600">
                        <span className="font-semibold">
                          {comment.userId?.name ||
                            comment.userId?.fname ||
                            "Unknown User"}
                        </span>
                        : {comment.content || "No content"}{" "}
                        <span className="text-xs text-gray-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

export default DailyFeed;
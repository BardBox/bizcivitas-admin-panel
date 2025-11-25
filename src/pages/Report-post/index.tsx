import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Paper,
  Avatar,
  Modal,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Select,
  FormControl,
  InputLabel,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FlagIcon from "@mui/icons-material/Flag";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";

interface User {
  _id?: string | null;
  name?: string | null;
  avatar?: string | null;
  username?: string | null;
}

interface Comment {
  _id: string;
  content: string;
  mediaUrl?: string | null;
  userId: User | null;
  createdAt: string;
  isHidden?: boolean;
  hiddenForUsers?: string[];
  likeCount: number;
  likes: Array<{ userId: User | null }>;
}

interface Post {
  _id: string;
  title: string;
  description: string;
  mediaUrl?: string | null;
  timeAgo: string;
  user: User | null;
  comments: Comment[];
  isHidden?: boolean;
  hiddenForUsers?: string[];
  likeCount: number;
  commentCount: number;
  isDailyFeed: boolean;
}

interface WallFeedComment {
  _id: string;
  content: string;
  mediaUrl?: string | null;
  userId: User | null;
  createdAt: string;
  isHidden?: boolean;
  hiddenForUsers?: string[];
}

interface Report {
  _id: string;
  reason: string;
  type: "post" | "comment" | "wallfeed_post" | "wallfeed_comment";
  status: string;
  adminAction: string;
  reporterId: { _id: string | null; username?: string | null };
  postId?: {
    _id: string | null;
    title: string | null;
    description: string | null;
  } | null;
  wallFeedId?: {
    _id: string | null;
    title: string | null;
    description: string | null;
    type: string | null;
  } | null;
  comment?: Comment | WallFeedComment | null;
  timeAgo: string;
  createdAt: string;
}

const AdminPostsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [actionMap, setActionMap] = useState<Record<string, string>>({});
  const [reportFilters, setReportFilters] = useState({
    reason: "",
    status: "",
    type: "",
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    postId?: string;
    commentId?: string;
    wallFeedId?: string;
    wallFeedCommentId?: string;
  } | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const reportReasons = [
    "spam",
    "inappropriate",
    "hate speech",
    "misinformation",
    "other",
  ];

  const actionOptions: Record<string, string[]> = {
    pending: [""],
    reviewed: [""],
    resolved: ["hide", "unhide", ""],
  };

  // Helper function to safely get user display name
  const getUserDisplayName = (user: User | null): string => {
    if (!user) return "Unknown User";
    return user.name || user.username || "Unknown User";
  };

  // Helper function to safely get user avatar
  const getUserAvatar = (user: User | null): string => {
    if (!user || !user.avatar) return "";
    return user.avatar;
  };

  useEffect(() => {
    activeTab === 0 ? fetchPosts() : fetchReports();
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/post");
      const postsData = res.data?.data?.posts || [];
      const convertedPosts = postsData.map((post: any) => ({
        ...post,
        likeCount: Number(post.likeCount) || 0,
        commentCount: Number(post.commentCount) || 0,
        isDailyFeed: post.isDailyFeed || false,
        comments: post.comments.map((comment: any) => ({
          ...comment,
          likeCount: Number(comment.likeCount) || 0,
        })),
      }));
      setPosts(convertedPosts);
    } catch (error) {
      toast.error("Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/report/admin/reports");
      setReports(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDailyFeed = async (
    postId: string,
    currentStatus: boolean
  ) => {
    console.log(
      `Toggling daily feed for post ${postId}: ${currentStatus} -> ${!currentStatus}`
    );

    try {
      const response = await api.patch(
        `/post/${postId}`,
        { isDailyFeed: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      console.log("API response:", response.data);

      const newStatus = !currentStatus;

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, isDailyFeed: newStatus } : post
        )
      );

      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost((prevPost) =>
          prevPost ? { ...prevPost, isDailyFeed: newStatus } : null
        );
      }

      toast.success("Daily Feed status updated", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error("Error updating daily feed:", err);
      toast.error(
        err.response?.data?.error || "Failed to update Daily Feed status",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  const existingReportsForPost = (postId: string) =>
    reports.filter((r) => r.postId?._id === postId);

  const renderHiddenIcon = (post: Post) => {
    const hasReport = existingReportsForPost(post._id).length > 0;
    const hasHidden = !!post.isHidden;
    const hasHiddenForUsers = (post.hiddenForUsers?.length || 0) > 0;
    if (!hasReport && !hasHidden && !hasHiddenForUsers) return null;
    return <VisibilityOffIcon sx={{ color: "red", ml: 1 }} />;
  };

  const handleReport = async () => {
    const reason = selectedReason === "other" ? customReason : selectedReason;
    if (!reason || !reportTarget) {
      toast.error("Please provide a valid reason.");
      return;
    }
    try {
      await api.post("/report", {
        postId: reportTarget.postId,
        commentId: reportTarget.commentId,
        wallFeedId: reportTarget.wallFeedId,
        wallFeedCommentId: reportTarget.wallFeedCommentId,
        reason,
      });
      
      if (reason === "misinformation") {
        toast.success("Reported successfully. Content hidden globally due to misinformation.", {
          autoClose: 5000,
        });
      } else {
        toast.success("Reported successfully");
      }
      
      setReportModalOpen(false);
      setSelectedReason("");
      setCustomReason("");
      setReportTarget(null);
      fetchPosts();
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Report failed");
    }
  };

  const handleReportStatusUpdate = async (reportId: string) => {
    const status = statusMap[reportId];
    const adminAction = actionMap[reportId] || "";
    if (!status) {
      toast.error("Select status");
      return;
    }
    try {
      await api.put(`/report/admin/reports/${reportId}`, {
        status,
        adminAction,
      });
      toast.success("Report updated");
      fetchPosts();
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      (!reportFilters.reason || r.reason === reportFilters.reason) &&
      (!reportFilters.status || r.status === reportFilters.status) &&
      (!reportFilters.type || r.type === reportFilters.type)
  );

  const handleReportClick = (postId: string) => {
    const post = posts.find((p) => p._id === postId);
    if (post) {
      setSelectedPost(post);
      setModalOpen(true);
      setActiveTab(0);
    }
  };

  // Helper to get content title based on report type
  const getReportContentTitle = (report: Report): string => {
    if (report.type === "wallfeed_post" || report.type === "wallfeed_comment") {
      return report.wallFeedId?.title || "Untitled WallFeed";
    }
    return report.postId?.title || "Untitled Post";
  };

  // Helper to render report type chip with color
  const getReportTypeChip = (type: string) => {
    const typeConfig: Record<string, { label: string; color: any }> = {
      post: { label: "POST", color: "primary" },
      comment: { label: "COMMENT", color: "secondary" },
      wallfeed_post: { label: "WALLFEED POST", color: "success" },
      wallfeed_comment: { label: "WALLFEED COMMENT", color: "warning" },
    };

    const config = typeConfig[type] || { label: type.toUpperCase(), color: "default" };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        sx={{ mr: 1 }}
      />
    );
  };

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="All Posts" />
        <Tab label="Reported Items" />
      </Tabs>

      {loading ? (
        <CircularProgress sx={{ mt: 5 }} />
      ) : activeTab === 0 ? (
        <Grid container spacing={3} mt={2} alignItems="stretch">
          {posts.map((post) => {
            if (!post || !post._id) return null;
            return (
              <Grid item key={post._id} xs={12} sm={6} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar src={getUserAvatar(post.user)} sx={{ mr: 2 }} />
                    <Box>
                      <Typography fontWeight="bold">
                        {getUserDisplayName(post.user)}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption">
                          {post.timeAgo || "Unknown time"}
                        </Typography>
                        {renderHiddenIcon(post)}
                      </Box>
                    </Box>
                    <IconButton
                      sx={{ ml: "auto" }}
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuPost(post);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Box flexGrow={1}>
                    <Typography fontWeight="bold" gutterBottom>
                      {post.title || "Untitled"}
                    </Typography>
                    <Typography sx={{ mb: 2 }}>
                      {post.description
                        ? post.description
                            .replace(/<[^>]*>/g, "")
                            .slice(0, 100) + "..."
                        : "No description available"}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">
                      Likes: {post.likeCount || 0}
                    </Typography>
                    <Typography variant="body2">
                      Comments: {post.commentCount || 0}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedPost(post);
                      setModalOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box mt={3}>
          <Grid container spacing={2} mb={3}>
            {["status", "type", "reason"].map((key) => (
              <Grid item xs={12} sm={4} key={key}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </InputLabel>
                  <Select
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={reportFilters[key as keyof typeof reportFilters]}
                    onChange={(e) =>
                      setReportFilters((p) => ({ ...p, [key]: e.target.value }))
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    {key === "status" &&
                      ["pending", "reviewed", "resolved"].map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}
                        </MenuItem>
                      ))}
                    {key === "type" &&
                      ["post", "comment", "wallfeed_post", "wallfeed_comment"].map((v) => (
                        <MenuItem key={v} value={v}>
                          {v.replace("_", " ")}
                        </MenuItem>
                      ))}
                    {key === "reason" &&
                      reportReasons.map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
          {filteredReports.length === 0 ? (
            <Typography>No matching reports.</Typography>
          ) : (
            filteredReports.map((r) => (
              <Paper key={r._id} sx={{ p: 2, mb: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {getReportTypeChip(r.type)}
                  {r.reason === "misinformation" && (
                    <Chip
                      label="AUTO-HIDDEN"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography
                  fontWeight="bold"
                  sx={{ 
                    color: r.type.includes("wallfeed") ? "green" : "blue", 
                    cursor: r.postId?._id ? "pointer" : "default",
                    mb: 1,
                  }}
                  onClick={() => {
                    if (r.postId?._id) {
                      handleReportClick(r.postId._id);
                    }
                  }}
                >
                  {getReportContentTitle(r)}
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                  <Chip 
                    label={`Reason: ${r.reason}`} 
                    size="small" 
                    variant="outlined"
                    color={r.reason === "misinformation" ? "error" : "default"}
                  />
                  <Chip 
                    label={`Status: ${r.status}`} 
                    size="small" 
                    color={
                      r.status === "resolved" ? "success" :
                      r.status === "reviewed" ? "warning" : "default"
                    }
                  />
                  {r.adminAction && (
                    <Chip 
                      label={`Action: ${r.adminAction}`} 
                      size="small" 
                      color="secondary"
                    />
                  )}
                </Box>

                <Typography variant="caption" color="textSecondary">
                  Reported by: {getUserDisplayName(r.reporterId as any) || r.reporterId?._id || "Unknown"}
                  {" • "}
                  {new Date(r.createdAt).toLocaleString()}
                </Typography>

                {r.comment && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box 
                      sx={{ 
                        bgcolor: "grey.100", 
                        p: 2, 
                        borderRadius: 1,
                        border: r.comment.isHidden ? "2px solid red" : "none",
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {r.type.includes("comment") ? "Reported Comment:" : "Comment:"}
                        {r.comment.isHidden && (
                          <Chip 
                            label="HIDDEN" 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" fontStyle="italic">
                        {r.comment.isHidden 
                          ? "(This comment is hidden)" 
                          : r.comment.content || "No content"}
                      </Typography>
                      {r.comment.mediaUrl && (
                        <Typography variant="caption" color="textSecondary">
                          📎 Has media attachment
                        </Typography>
                      )}
                    </Box>
                  </>
                )}

                <Box
                  display="flex"
                  gap={2}
                  mt={2}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusMap[r._id] || r.status}
                      onChange={(e) =>
                        setStatusMap((prev) => ({
                          ...prev,
                          [r._id]: e.target.value,
                        }))
                      }
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="reviewed">Reviewed</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                    </Select>
                  </FormControl>
                  {(statusMap[r._id] || r.status) === "reviewed" ? (
                    <TextField
                      size="small"
                      sx={{ minWidth: 140 }}
                      label="Admin Action"
                      value={actionMap[r._id] || r.adminAction || ""}
                      onChange={(e) =>
                        setActionMap((prev) => ({
                          ...prev,
                          [r._id]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    (actionOptions[statusMap[r._id] || r.status] || []).length >
                      0 && (
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Admin Action</InputLabel>
                        <Select
                          value={actionMap[r._id] || r.adminAction || ""}
                          onChange={(e) =>
                            setActionMap((prev) => ({
                              ...prev,
                              [r._id]: e.target.value,
                            }))
                          }
                          label="Admin Action"
                        >
                          {actionOptions[statusMap[r._id] || r.status].map(
                            (option) => (
                              <MenuItem key={option} value={option}>
                                {option || "None"}
                              </MenuItem>
                            )
                          )}
                        </Select>
                      </FormControl>
                    )
                  )}
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleReportStatusUpdate(r._id)}
                  >
                    Save
                  </Button>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setSelectedPost(menuPost);
            setModalOpen(true);
            setMenuAnchor(null);
          }}
        >
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            menuPost && setReportTarget({ postId: menuPost._id });
            setReportModalOpen(true);
            setMenuAnchor(null);
          }}
        >
          Report
        </MenuItem>
      </Menu>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "90%",
            maxWidth: 600,
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {selectedPost && (
            <>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar src={getUserAvatar(selectedPost.user)} sx={{ mr: 2 }} />
                <Box flexGrow={1}>
                  <Typography fontWeight="bold">
                    {getUserDisplayName(selectedPost.user)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption">
                      {selectedPost.timeAgo || "Unknown time"}
                    </Typography>
                    {renderHiddenIcon(selectedPost)}
                  </Box>
                </Box>
                <Tooltip title="Report Post">
                  <IconButton
                    onClick={() => {
                      setReportTarget({ postId: selectedPost._id });
                      setReportModalOpen(true);
                    }}
                  >
                    <FlagIcon color="error" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h6">
                {selectedPost.title || "Untitled"}
              </Typography>
              <Typography
                dangerouslySetInnerHTML={{
                  __html:
                    selectedPost.description || "No description available",
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedPost.isDailyFeed}
                    onChange={() =>
                      handleToggleDailyFeed(
                        selectedPost._id,
                        selectedPost.isDailyFeed
                      )
                    }
                  />
                }
                label="Add to Daily Feed"
                sx={{ mt: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold">Comments</Typography>
              {selectedPost.comments.length === 0 ? (
                <Typography>No comments.</Typography>
              ) : (
                selectedPost.comments.map((c) => (
                  <Box key={c._id} display="flex" alignItems="center" mt={1}>
                    <Box flexGrow={1}>
                      <Typography fontWeight="bold">
                        {getUserDisplayName(c.userId)}
                      </Typography>
                      <Typography variant="body2">
                        {c.isHidden ? "(Hidden)" : c.content || "No content"}
                      </Typography>
                    </Box>
                    <Tooltip title="Report Comment">
                      <IconButton
                        onClick={() => {
                          setReportTarget({
                            postId: selectedPost._id,
                            commentId: c._id,
                          });
                          setReportModalOpen(true);
                        }}
                      >
                        <FlagIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))
              )}
            </>
          )}
        </Box>
      </Modal>

      <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 320,
            bgcolor: "background.paper",
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" mb={2}>
            Report Content
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Reason</InputLabel>
            <Select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              label="Reason"
            >
              {reportReasons.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedReason === "misinformation" && (
            <Box 
              sx={{ 
                bgcolor: "error.light", 
                color: "error.contrastText",
                p: 1.5, 
                borderRadius: 1, 
                mb: 2,
              }}
            >
              <Typography variant="caption" fontWeight="bold">
                ⚠️ Misinformation reports will automatically hide the content globally for all users.
              </Typography>
            </Box>
          )}
          {selectedReason === "other" && (
            <TextField
              size="small"
              fullWidth
              placeholder="Custom reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1 }}
            onClick={handleReport}
          >
            Submit Report
          </Button>
        </Box>
      </Modal>

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Box>
  );
};

export default AdminPostsPage;
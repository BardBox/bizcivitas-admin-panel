import React, { useState, useEffect, useRef } from "react";
import { FiPlus, FiX, FiPlayCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useVisibility } from "../../context/VisibilityContext";
import api from "../../api/api";
import RichTextEditor from "../../component/RichTextEditor";

// Interfaces
interface PollOption {
  text: string;
  votes: number;
}

interface VideoData {
  _id?: string;
  vimeoId?: string;
  embedLink?: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string;
  mimeType?: string;
  fileExtension?: string;
  sizeInBytes?: number;
  status?: string;
}

interface Content {
  id: string;
  type: "travelStories" | "lightPulse" | "spotlightStories" | "pulsePolls" | "businessBoosters" | "foundersDesk" ;
  title?: string;
  description?: string[];
  question?: string;
  options?: PollOption[];
  images: string[];
  videos: VideoData[];
  createdAt: string;
  isDailyFeed?: boolean;
  poll?: {
    question: string;
    options: PollOption[];
    totalVotes: number;
  };
}

interface FormData {
  type: "travelStories" | "lightPulse" | "spotlightStories" | "pulsePolls" | "businessBoosters" | "foundersDesk" | "";
  title?: string;
  description?: string[];
  question?: string;
  options?: string[];
  images: File[];
  videos: File[];
  thumbnails: (File | null)[];
  visibility?: "public" | "connections" | "community" | "";
  communityId?: string;
  isDailyFeed?: boolean;
  removeImages?: string[];
  removeVideos?: string[];
}

const typeColors = {
  travelStories: "bg-blue-100 text-blue-800",
  lightPulse: "bg-green-100 text-green-800",
  spotlightStories: "bg-purple-100 text-purple-800",
  pulsePolls: "bg-yellow-100 text-yellow-800",
  businessBoosters: "bg-red-100 text-red-800",
  foundersDesk: "bg-indigo-100 text-indigo-800",
  poll: "bg-yellow-100 text-yellow-800", // Same as pulsePolls for UI consistency
};

const Wallfeed = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewContent, setViewContent] = useState<Content | null>(null);
  const [formData, setFormData] = useState<FormData>({
    type: "",
    title: "",
    description: [""],
    question: "",
    options: ["", ""],
    images: [],
    videos: [],
    thumbnails: [],
    visibility: "public",
    communityId: "",
    isDailyFeed: false,
    removeImages: [],
    removeVideos: [],
  });
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [thumbnailPreviews, setThumbnailPreviews] = useState<(string | null)[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [playingVideo, setPlayingVideo] = useState<{ [key: string]: boolean }>({});
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const viewModalRef = useRef<HTMLDivElement>(null);
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  const contentTypes = [
    "travelStories",
    "lightPulse",
    "spotlightStories",
    "pulsePolls",
    "businessBoosters",
    "foundersDesk",
    "poll", // Keep poll for API compatibility
  ];
  const displayContentTypes = [
    "travelStories",
    "lightPulse",
    "spotlightStories",
    "pulsePolls", // Only pulsePolls in UI filter
    "businessBoosters",
    "foundersDesk",
  ];

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.slice(0, maxLength) + "...";
  };

  const isHtmlContentEmpty = (html: string): boolean => {
    if (!html || html.trim() === "") return true;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.trim() === "";
  };

  const getPreviewText = (content: Content) => {
    if (content.description?.[0]) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content.description[0];
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      return truncateText(plainText, 100);
    }
    return "No content available";
  };

  const BASE_URL = "https://backend.bizcivitas.com/api/v1";

  const fetchWallFeeds = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get("/wallfeed");

      if (!response.data || !response.data.data || !Array.isArray(response.data.data.wallFeeds)) {
        throw new Error("Invalid API response structure: wallFeeds not found or not an array");
      }

      const wallFeeds = response.data.data.wallFeeds;

      const mappedContents: Content[] = wallFeeds
        .filter((feed: any) => contentTypes.includes(feed.type))
        .map((feed: any) => ({
          id: feed._id,
          type: feed.type === "poll" ? "pulsePolls" : feed.type, // Map poll to pulsePolls for UI
          title: feed.title || "",
          description: Array.isArray(feed.description) ? feed.description : [],
          question: feed.type === "poll" || feed.type === "pulsePolls" ? feed.poll?.question : undefined,
          options: (feed.type === "poll" || feed.type === "pulsePolls") && Array.isArray(feed.poll?.options)
            ? feed.poll.options.map((opt: any) => ({
                text: opt.text,
                votes: opt.votes || 0,
              }))
            : undefined,
          images: Array.isArray(feed.images) && feed.images.length
            ? feed.images.map((img: string) => `${BASE_URL}/image/${img}`)
            : [],
          videos: Array.isArray(feed.videos) ? feed.videos : [],
          createdAt: feed.createdAt,
          isDailyFeed: !!feed.isDailyFeed,
          poll: feed.type === "poll" || feed.type === "pulsePolls" ? feed.poll : undefined,
        }));

      setContents(mappedContents);
    } catch (err: any) {
      console.error("Fetch wall feeds error:", err);
      setError(err.message || "Failed to fetch wall feeds. Please check the API response and try again.");
      toast.error(err.message || "Failed to fetch wall feeds.");
      setContents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallFeeds();
  }, []);

  useEffect(() => {
    setSidebarAndHeaderVisibility(!isModalOpen && !viewModalOpen);
  }, [isModalOpen, viewModalOpen, setSidebarAndHeaderVisibility]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
      if (viewModalRef.current && !viewModalRef.current.contains(event.target as Node)) {
        setViewModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openModal = (content: Content | null = null) => {
    if (content) {
      setFormData({
        type: content.type, // Keep original type for editing
        title: content.type === "pulsePolls" ? "" : content.title || "",
        description: content.type === "pulsePolls" ? [""] : content.description || [""],
        question: content.question || "",
        options: content.options ? content.options.map((opt) => opt.text) : ["", ""],
        images: [],
        videos: [],
        thumbnails: content.videos?.map(() => null) || [],
        visibility: "public",
        communityId: "",
        isDailyFeed: content.isDailyFeed || false,
        removeImages: [],
        removeVideos: [],
      });
      setImagePreviews(content.images);
      setVideoPreviews(content.videos?.map((v) => v.embedLink || "") || []);
      setThumbnailPreviews(content.videos?.map((v) => v.thumbnailUrl || null) || []);
      setSelectedContent(content);
    } else {
      setFormData({
        type: "",
        title: "",
        description: [""],
        question: "",
        options: ["", ""],
        images: [],
        videos: [],
        thumbnails: [],
        visibility: "public",
        communityId: "",
        isDailyFeed: false,
        removeImages: [],
        removeVideos: [],
      });
      setImagePreviews([]);
      setVideoPreviews([]);
      setThumbnailPreviews([]);
      setSelectedContent(null);
    }
    setIsModalOpen(true);
  };

  const openViewModal = (content: Content) => {
    // Find the latest version of this content from the contents state
    const latestContent = contents.find(c => c.id === content.id) || content;
    setViewContent(latestContent);
    setViewModalOpen(true);
    setPlayingVideo({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let updatedValue: string | boolean = value;
    if (e.target.type === "checkbox") {
      updatedValue = (e.target as HTMLInputElement).checked;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newDescription = [...(prev.description || [""])];
      newDescription[index] = value;
      return { ...prev, description: newDescription };
    });
  };

  const addDescriptionPoint = () => {
    setFormData((prev) => ({
      ...prev,
      description: [...(prev.description || [""]), ""],
    }));
  };

  const removeDescriptionPoint = (index: number) => {
    setFormData((prev) => {
      const newDescription = (prev.description || [""]).filter((_, i) => i !== index);
      return {
        ...prev,
        description: newDescription.length ? newDescription : [""],
      };
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...(prev.options || ["", ""])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || ["", ""]), ""],
    }));
  };

  const removeOption = (index: number) => {
    setFormData((prev) => {
      const newOptions = (prev.options || ["", ""]).filter((_, i) => i !== index);
      return {
        ...prev,
        options: newOptions.length >= 2 ? newOptions : ["", ""],
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Mark existing videos for removal when switching to images
    const videosToRemove = selectedContent?.videos?.map(v => v._id).filter((id): id is string => Boolean(id)) || [];

    const validFiles: File[] = [];
    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`Image ${file.name} exceeds 2MB. Please upload a smaller image.`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not a valid image.`);
        return;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
      videos: [],
      thumbnails: [],
      removeVideos: [...(prev.removeVideos || []), ...videosToRemove],
    }));
    setVideoPreviews([]);
    setThumbnailPreviews([]);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Mark existing videos for removal when uploading new videos during edit
    const videosToRemove = selectedContent?.videos?.map(v => v._id).filter((id): id is string => Boolean(id)) || [];

    // Clear existing video previews if we're replacing them
    const shouldClearExisting = selectedContent && videoPreviews.length > 0;

    const validFiles: File[] = [];
    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error(`Video ${file.name} exceeds 50MB. Please upload a smaller video.`);
        return;
      }
      if (!file.type.startsWith("video/")) {
        toast.error(`File ${file.name} is not a valid video.`);
        return;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          // If replacing existing videos, clear old previews; otherwise append
          setVideoPreviews(shouldClearExisting ? previews : (prev) => [...prev, ...previews]);
          setThumbnailPreviews(shouldClearExisting ? Array(validFiles.length).fill(null) : (prev) => [...prev, ...Array(validFiles.length).fill(null)]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Mark existing images for removal when switching to videos
    // Extract image paths from full URLs (remove BASE_URL/image/ prefix)
    const imagesToRemove = (selectedContent?.images || []).map(img =>
      img.replace(`${BASE_URL}/image/`, '')
    );

    setFormData((prev) => ({
      ...prev,
      videos: shouldClearExisting ? validFiles : [...prev.videos, ...validFiles],
      thumbnails: shouldClearExisting ? Array(validFiles.length).fill(null) : [...prev.thumbnails, ...Array(validFiles.length).fill(null)],
      images: [],
      removeImages: [...(prev.removeImages || []), ...imagesToRemove],
      removeVideos: [...(prev.removeVideos || []), ...videosToRemove],
    }));
    setImagePreviews([]);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>, videoIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`Thumbnail ${file.name} exceeds 2MB. Please upload a smaller image.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error(`File ${file.name} is not a valid image.`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[videoIndex] = reader.result as string;
        return newPreviews;
      });
    };
    reader.readAsDataURL(file);
    setFormData((prev) => {
      const newThumbnails = [...prev.thumbnails];
      newThumbnails[videoIndex] = file;
      return { ...prev, thumbnails: newThumbnails };
    });
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    // Check if this is an existing image from server (starts with http/https) or a new local image (starts with blob:)
    const isExistingImage = selectedContent && (imagePreviews[index].startsWith('http://') || imagePreviews[index].startsWith('https://'));

    if (isExistingImage) {
      // Extract the image path from the full URL
      // URL format: https://backend.bizcivitas.com/api/v1/image/wallFeed/filename.jpg
      // Backend expects: wallFeed/filename.jpg
      const imageUrl = imagePreviews[index];
      const imagePath = imageUrl.replace(`${BASE_URL}/image/`, '');

      console.log('Removing image:', { fullUrl: imageUrl, path: imagePath });

      setFormData((prev) => ({
        ...prev,
        removeImages: [...(prev.removeImages || []), imagePath],
      }));
    }
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    if (selectedContent && selectedContent.videos && selectedContent.videos[index]?._id) {
      setFormData((prev) => ({
        ...prev,
        removeVideos: [...(prev.removeVideos || []), selectedContent.videos[index]._id!],
      }));
    }
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
      thumbnails: prev.thumbnails.filter((_, i) => i !== index),
    }));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
    setThumbnailPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerImageInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const triggerVideoInput = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const triggerThumbnailInput = (videoIndex: number) => {
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.dataset.videoIndex = videoIndex.toString();
      thumbnailInputRef.current.click();
    }
  };

  const handlePlayVideo = (contentId: string, videoIndex: number) => {
    setPlayingVideo((prev) => ({
      ...prev,
      [`${contentId}-${videoIndex}`]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) {
      toast.error("Type is required.");
      return;
    }

    // Validation for non-poll types
    if (formData.type !== "pulsePolls") {
      if (!formData.title?.trim()) {
        toast.error("Title is required.");
        return;
      }
      if (!formData.description || formData.description.some((desc) => isHtmlContentEmpty(desc))) {
        toast.error("All description points must be filled.");
        return;
      }
      // Check if there's at least one media (image or video) - for new posts or when editing without existing media
      const hasExistingMedia = selectedContent && (imagePreviews.length > 0 || videoPreviews.length > 0);
      const hasNewMedia = formData.images.length > 0 || formData.videos.length > 0;

      if (!selectedContent && !hasNewMedia) {
        toast.error(`Please upload at least one image or video for the ${formData.type}.`);
        return;
      }

      if (selectedContent && !hasExistingMedia && !hasNewMedia) {
        toast.error(`Please upload at least one image or video for the ${formData.type}.`);
        return;
      }

      // Validate thumbnails only for NEW videos being uploaded
      // Only check if we're uploading new videos (formData.videos contains File objects)
      const newVideoCount = formData.videos.length;
      const newThumbnailCount = formData.thumbnails.filter((_, i) => {
        // Count thumbnails for newly uploaded videos (not existing ones)
        // If we're editing, we need to check which thumbnails correspond to new videos
        return i >= (videoPreviews.length - newVideoCount);
      }).length;

      if (newVideoCount > 0 && newVideoCount !== newThumbnailCount) {
        toast.error("Each video must have a corresponding thumbnail entry (can be null).");
        return;
      }
    } else {
      // Validation for pulsePolls
      if (!formData.question?.trim()) {
        toast.error("Question is required for a poll.");
        return;
      }
      if (!formData.options || formData.options.length < 2) {
        toast.error("At least two options are required for a poll.");
        return;
      }
      if (formData.options.some((opt) => !opt.trim())) {
        toast.error("All poll options must be filled.");
        return;
      }
    }

    if (formData.visibility === "community" && !formData.communityId?.trim()) {
      toast.error("Community ID is required for community visibility.");
      return;
    }

    setIsSubmitting(true);

    // Check if we're uploading new videos
    const hasNewVideos = formData.type !== "pulsePolls" && formData.videos.length > 0;
    if (hasNewVideos) {
      setIsUploadingVideo(true);
    }

    try {
      const form = new FormData();
      // Send type as "poll" for pulsePolls
      form.append("type", formData.type === "pulsePolls" ? "poll" : formData.type);

      if (formData.type !== "pulsePolls") {
        form.append("title", formData.title || "");
        formData.description?.forEach((desc, index) => {
          form.append(`description[${index}]`, desc);
        });
      } else {
        form.append("pollQuestion", formData.question || "");
        formData.options?.forEach((option, index) => {
          form.append(`pollOptions[${index}]`, option);
        });
      }

      form.append("visibility", formData.visibility || "public");
      if (formData.visibility === "community") {
        form.append("communityId", formData.communityId || "");
      }
      form.append("isDailyFeed", formData.isDailyFeed ? "true" : "false");

      if (formData.type !== "pulsePolls" && formData.images.length) {
        formData.images.forEach((image) => {
          form.append("image", image);
        });
      }
      if (formData.type !== "pulsePolls" && formData.videos.length) {
        formData.videos.forEach((video, index) => {
          form.append("video", video);
          if (formData.thumbnails[index]) {
            form.append("thumbnail", formData.thumbnails[index]!);
          }
        });
      }
      if (selectedContent && formData.removeImages?.length) {
        console.log('Removing images:', formData.removeImages);
        formData.removeImages.forEach((img) => {
          form.append("removeImages[]", img);
        });
      }
      if (selectedContent && formData.removeVideos?.length) {
        console.log('Removing videos:', formData.removeVideos);
        formData.removeVideos.forEach((vid) => {
          form.append("removeVideos[]", vid);
        });
      }

      console.log('Submit data:', {
        hasNewImages: formData.images.length > 0,
        hasNewVideos: formData.videos.length > 0,
        existingImagePreviews: imagePreviews.length,
        existingVideoPreviews: videoPreviews.length,
        removeImages: formData.removeImages,
        removeVideos: formData.removeVideos
      });

      let url;
      let method = "post";
      if (selectedContent) {
        url = `/wallfeed/edit-generic/${selectedContent.id}`;
        method = "put";
      } else {
        url = `/wallfeed/create-generic`;
      }

      const response = await api({
        method,
        url,
        data: form,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        await fetchWallFeeds();

        // Show different success messages based on whether videos were uploaded
        if (hasNewVideos) {
          toast.success(
            `${formData.type} ${selectedContent ? "updated" : "created"} successfully! Video is processing and will be available shortly.`,
            { autoClose: 5000 }
          );
        } else {
          toast.success(`${formData.type} ${selectedContent ? "updated" : "created"} successfully.`);
        }

        setIsModalOpen(false);
      } else {
        toast.error(response.data.message || `Failed to save the ${formData.type}.`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to save the ${formData.type}.`);
    } finally {
      setIsSubmitting(false);
      setIsUploadingVideo(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      const response = await api.delete(`/wallfeed/delete/${id}`);
      if (response.data.success) {
        setContents((prevContents) => prevContents.filter((content) => content.id !== id));
        setConfirmDelete(null);
        toast.success("Content deleted successfully.");
      } else {
        toast.error(response.data.message || "Failed to delete content.");
      }
    } catch (error: any) {
      console.error("Error deleting content:", error);
      toast.error(error.response?.data?.message || "Failed to delete the content.");
      await fetchWallFeeds();
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const showLargeImage = (src: string) => {
    toast(
      <div>
        <img src={src} alt="Large Image" className="w-full h-auto max-w-lg" />
        <button
          onClick={() => toast.dismiss()}
          className="mt-2 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-200 text-sm sm:text-base"
        >
          Close
        </button>
      </div>,
      {
        autoClose: false,
        closeOnClick: true,
        closeButton: false,
      }
    );
  };

  const filteredContents = filterType === "all"
    ? contents
    : filterType === "pulsePolls"
    ? contents.filter((content) => content.type === "pulsePolls")
    : contents.filter((content) => content.type === filterType);

  return (
    <div className="p-4 sm:p-6 rounded-lg w-full mx-auto min-h-screen">
      <style>
        {`
          .content-scroll {
            overflow-y: auto;
            max-height: 90vh;
          }
          .card-scroll {
            overflow-y: auto;
            max-height: 500px;
          }
          .card-scroll::-webkit-scrollbar, .content-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .card-scroll::-webkit-scrollbar-track, .content-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .card-scroll::-webkit-scrollbar-thumb, .content-scroll::-webkit-scrollbar-thumb {
            background: #9ca3af;
            border-radius: 4px;
          }
          .card-scroll::-webkit-scrollbar-thumb:hover, .content-scroll::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          .card-scroll, .content-scroll {
            scrollbar-width: thin;
            scrollbar-color: #9ca3af #f1f1f1;
          }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .media-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 10px;
          }
          .image-container {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 8px;
          }
          .image-container::-webkit-scrollbar {
            height: 8px;
          }
          .image-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .image-container::-webkit-scrollbar-thumb {
            background: #9ca3af;
            border-radius: 4px;
          }
          .image-container::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          .media-item {
            position: relative;
            width: 100%;
            max-width: 400px;
            height: 200px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .view-media-item {
            position: relative;
            width: 100%;
            max-width: 600px;
            height: 300px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .image-item {
            position: relative;
            flex: 0 0 200px;
            height: 150px;
            border-radius: 8px;
            overflow: hidden;
          }
          .view-image-item {
            flex: 0 0 300px;
            height: 200px;
            border-radius: 8px;
            overflow: hidden;
          }
          .media-item img, .media-item video, .media-item iframe, .image-item img,
          .view-media-item img, .view-media-item video, .view-media-item iframe, .view-image-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .media-item button, .image-item button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 2px solid white;
            z-index: 10;
          }
          .media-item button:hover, .image-item button:hover {
            background: #dc2626;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          .thumbnail-selector {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            max-width: 400px;
          }
          .thumbnail-button {
            padding: 8px 16px;
            background: #ef4444;
            color: white;
            border-radius: 4px;
            text-align: center;
            transition: background 0.2s;
          }
          .thumbnail-button:hover {
            background: #dc2626;
          }
          .view-media-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 16px;
          }
          .view-image-container {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 8px;
          }
          .view-image-container::-webkit-scrollbar {
            height: 8px;
          }
          .view-image-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .view-image-container::-webkit-scrollbar-thumb {
            background: #9ca3af;
            border-radius: 4px;
          }
          .view-image-container::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          .type-tag {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .pulse-card {
            border: 2px solid #facc15;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            opacity: 0.8;
            transition: opacity 0.2s, transform 0.2s;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            padding: 10px;
          }
          .play-button:hover {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          /* Preserve line breaks in rendered content */
          .prose p {
            margin: 0.5rem 0;
            min-height: 1.2em; /* Ensure empty paragraphs are visible */
            display: block;
          }
          /* Handle empty paragraphs */
          .prose p:empty {
            min-height: 1.2em;
            display: block;
          }
          /* Handle paragraphs that only contain zero-width space or whitespace */
          .prose p:has(> :only-child) {
            min-height: 1.2em;
          }
          /* Ensure paragraphs with zero-width space are visible */
          .prose p {
            white-space: pre-wrap; /* Preserve whitespace and line breaks */
          }
          .prose br {
            display: block;
            margin: 0.5rem 0;
            line-height: 1.5;
          }
        `}
      </style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <label className="text-gray-700 font-medium">Filter by Type</label>
          <select
            value={filterType}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {displayContentTypes.map((type) => (
              <option key={type} value={type}>
                {type
                  .split(/(?=[A-Z])/)
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <FiPlus size={20} /> Add Content
        </button>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : filteredContents.length === 0 ? (
        <p className="text-center text-gray-500">No content available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContents.map((content) => (
            <div
              key={content.id}
              className={`bg-white p-6 rounded-lg shadow-sm transition duration-200 hover:shadow-md flex flex-col card-scroll ${
                content.type === "pulsePolls" && filterType === "pulsePolls" ? "pulse-card" : ""
              }`}
            >
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className={`type-tag ${typeColors[content.type]}`}>
                      {content.type === "pulsePolls" ? "Pulse Polls" : content.type
                        .split(/(?=[A-Z])/)
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-semibold capitalize mt-2">
                      {content.title || content.question || "Untitled"}
                    </h2>
                  </div>
                </div>
                {content.type === "pulsePolls" ? (
                  <div>
                    <p className="text-gray-500">
                      <strong>Date:</strong> {new Date(content.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex flex-col gap-4 mt-4">
                      {content.options?.map((option, index) => (
                        <div key={index} className="bg-gray-200 p-4 rounded-lg text-center">
                          <p className="text-lg font-semibold">{option.text}</p>
                          <p className="text-gray-700">{option.votes} votes</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-black">
                    {content.images.length > 0 && (
                      <div className="image-container">
                        {content.images.map((img, index) => (
                          <div key={`image-${index}`} className="image-item">
                            <img
                              src={img}
                              alt={`${content.title || content.question || "Content"} ${index + 1}`}
                              className="cursor-pointer"
                              onClick={() => showLargeImage(img)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/300x150?text=No+Image";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {content.videos.length > 0 && (
                      <div className="media-container">
                        {content.videos.map((video, index) => (
                          <div key={`video-${index}`} className="media-item">
                            {playingVideo[`${content.id}-${index}`] ? (
                              video.embedLink ? (
                                <iframe
                                  src={video.embedLink}
                                  className="w-full h-full rounded-md"
                                  allow="autoplay; fullscreen"
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                  <p className="text-gray-500">Video Not Available</p>
                                </div>
                              )
                            ) : (
                              <>
                                <img
                                  src={video.thumbnailUrl || "https://placehold.co/400x200?text=No+Thumbnail"}
                                  alt={`Video thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover rounded-md"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/400x200?text=No+Thumbnail";
                                  }}
                                />
                                <FiPlayCircle
                                  size={48}
                                  className="play-button"
                                  onClick={() => handlePlayVideo(content.id, index)}
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      className="mb-2 text-gray-700 line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: getPreviewText(content) }}
                    />
                    <p className="text-gray-500">
                      <strong>Date:</strong> {new Date(content.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <button
                  onClick={() => openViewModal(content)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200 text-sm sm:text-base"
                >
                  View
                </button>
                <button
                  onClick={() => openModal(content)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 text-sm sm:text-base"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(content.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200 text-sm sm:text-base"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-6">
              Are you sure you want to delete this content?
            </h3>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-200 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div
            ref={modalRef}
            className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative content-scroll"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
            <h3 className="text-lg sm:text-xl font-semibold mb-6">
              {selectedContent ? "Update Content" : "Add New Content"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  {displayContentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type
                        .split(/(?=[A-Z])/)
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>
              {formData.type && (
                <>
                  <div className="col-span-1 md:col-span-1">
                    <label className="block text-gray-700">Visibility</label>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="connections">Connections</option>
                      <option value="community">Community</option>
                    </select>
                  </div>
                  {formData.visibility === "community" && (
                    <div className="col-span-1 md:col-span-1">
                      <label className="block text-gray-700">Community ID</label>
                      <input
                        type="text"
                        name="communityId"
                        value={formData.communityId || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Community ID"
                        required
                      />
                    </div>
                  )}
                  {formData.type !== "pulsePolls" && (
                    <>
                      <div className="col-span-1 md:col-span-1">
                        <label className="block text-gray-700">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-gray-700 mb-2">Description</label>
                        {(formData.description || [""]).map((desc, index) => (
                          <div key={index} className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-600">
                                Description Point {index + 1}
                              </label>
                              {formData.description && formData.description.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeDescriptionPoint(index)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded"
                                  title="Remove this description point"
                                >
                                  <FiX size={16} />
                                </button>
                              )}
                            </div>
                            <RichTextEditor
                              content={desc}
                              onChange={(content) => handleDescriptionChange(index, content)}
                              placeholder={`Enter description point ${index + 1}...`}
                              className="mb-2"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addDescriptionPoint}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2 px-3 py-2 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <FiPlus size={16} /> Add Description Point
                        </button>
                      </div>
                    </>
                  )}
                  {formData.type === "pulsePolls" && (
                    <>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-gray-700">Question</label>
                        <input
                          type="text"
                          name="question"
                          value={formData.question || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-gray-700">Options</label>
                        {(formData.options || ["", ""]).map((option, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              placeholder={`Option ${index + 1}`}
                            />
                            {formData.options && formData.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FiX size={20} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addOption}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <FiPlus size={20} /> Add Option
                        </button>
                      </div>
                    </>
                  )}
                  {formData.type !== "pulsePolls" && (
                    <>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-gray-700 mb-2">
                          Images{" "}
                          {selectedContent ? "(Leave empty to keep current images)" : "(At least one image or video required)"}
                          <span className="text-sm text-gray-500 ml-2">Max size: 2MB each</span>
                        </label>
                        {!videoPreviews.length ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={triggerImageInput}
                              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                            >
                              Select Images
                            </button>
                            <input
                              type="file"
                              name="images"
                              accept="image/*"
                              onChange={handleImageChange}
                              ref={imageInputRef}
                              className="hidden"
                              multiple
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            To add images, please remove all videos first.
                          </p>
                        )}
                        {imagePreviews.length > 0 && (
                          <div className="image-container">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="image-item">
                                <img src={preview} alt={`Preview ${index + 1}`} />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  title="Remove image"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-gray-700 mb-2">
                          Videos{" "}
                          {selectedContent ? "(Leave empty to keep current videos)" : "(At least one image or video required)"}
                          <span className="text-sm text-gray-500 ml-2">Max size: 50MB each</span>
                        </label>
                        {!imagePreviews.length ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={triggerVideoInput}
                              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                            >
                              Select Videos
                            </button>
                            <input
                              type="file"
                              name="videos"
                              accept="video/*"
                              onChange={handleVideoChange}
                              ref={videoInputRef}
                              className="hidden"
                              multiple
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            To add videos, please remove all images first.
                          </p>
                        )}
                        {videoPreviews.length > 0 && (
                          <div className="media-container">
                            {videoPreviews.map((preview, index) => {
                              // Check if this is an existing video (has embedLink) or a new upload
                              const isExistingVideo = selectedContent && selectedContent.videos && selectedContent.videos[index]?.embedLink;
                              const isNewVideo = !isExistingVideo && preview;

                              return (
                                <div key={index} className="flex flex-col gap-4">
                                  <div className="media-item">
                                    {isExistingVideo ? (
                                      <iframe
                                        src={selectedContent.videos[index].embedLink}
                                        className="w-full h-full rounded-md"
                                        allow="autoplay; fullscreen"
                                        allowFullScreen
                                      ></iframe>
                                    ) : preview ? (
                                      <video
                                        src={preview}
                                        controls
                                        className="w-full h-full object-cover rounded-md"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                        <p className="text-gray-500">Video Preview</p>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeVideo(index)}
                                      title="Remove video"
                                    >
                                      <FiX size={16} />
                                    </button>
                                  </div>
                                  {/* Only show thumbnail selector for NEW videos, not existing ones */}
                                  {isNewVideo && (
                                    <div className="thumbnail-selector">
                                      <label className="block text-gray-700 text-sm">
                                        Thumbnail for Video {index + 1} (Optional)
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => triggerThumbnailInput(index)}
                                        className="thumbnail-button"
                                      >
                                        Select Thumbnail
                                      </button>
                                      {thumbnailPreviews[index] && (
                                        <div className="mt-2">
                                          <img
                                            src={thumbnailPreviews[index]!}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-24 h-24 object-cover rounded-md border border-gray-200"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleThumbnailChange(e, parseInt(e.target.dataset.videoIndex || "0"))}
                          ref={thumbnailInputRef}
                          className="hidden"
                        />
                      </div>
                    </>
                  )}
                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        name="isDailyFeed"
                        checked={formData.isDailyFeed || false}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      Add to Daily Feed
                    </label>
                  </div>
                  {isUploadingVideo && (
                    <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <p className="text-blue-700 text-sm">
                        <strong>Uploading video to Vimeo...</strong> This may take a few moments. The video will be available shortly after saving.
                      </p>
                    </div>
                  )}
                  <div className="col-span-2 flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-200 text-sm sm:text-base ${
                        isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm sm:text-base ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isUploadingVideo ? "Uploading video..." : isSubmitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      {viewModalOpen && viewContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div
            ref={viewModalRef}
            className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative content-scroll"
          >
            <button
              onClick={() => setViewModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
            <h3 className="text-lg sm:text-xl font-semibold mb-6">View Content</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`type-tag ${typeColors[viewContent.type]}`}>
                    {viewContent.type === "pulsePolls" ? "Pulse Polls" : viewContent.type
                      .split(/(?=[A-Z])/)
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold capitalize mt-2">
                    {viewContent.title || viewContent.question || "Untitled"}
                  </h2>
                </div>
              </div>
              <div className="view-media-container">
                {viewContent.images.length > 0 && (
                  <div className="view-image-container">
                    {viewContent.images.map((img, index) => (
                      <div key={`image-${index}`} className="view-image-item">
                        <img
                          src={img}
                          alt={`${viewContent.title || viewContent.question || "Content"} ${index + 1}`}
                          className="cursor-pointer"
                          onClick={() => showLargeImage(img)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/300x150?text=No+Image";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {viewContent.videos.length > 0 && (
                  <div className="view-media-container">
                    {viewContent.videos.map((video, index) => (
                      <div key={`video-${index}`} className="view-media-item">
                        {playingVideo[`${viewContent.id}-${index}`] ? (
                          video.embedLink ? (
                            <iframe
                              src={video.embedLink}
                              className="w-full h-full rounded-md"
                              allow="autoplay; fullscreen"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                              <p className="text-gray-500">Video Not Available</p>
                            </div>
                          )
                        ) : (
                          <>
                            <img
                              src={video.thumbnailUrl || "https://placehold.co/600x300?text=No+Thumbnail"}
                              alt={`Video thumbnail ${index + 1}`}
                              className="w-full h-full object-cover rounded-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/600x300?text=No+Thumbnail";
                              }}
                            />
                            <FiPlayCircle
                              size={64}
                              className="play-button"
                              onClick={() => handlePlayVideo(viewContent.id, index)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {viewContent.type === "pulsePolls" ? (
                <>
                  <div>
                    <strong>Options:</strong>
                    <ul className="list-disc pl-5">
                      {viewContent.options?.map((option, index) => (
                        <li key={index}>
                          {option.text} ({option.votes} votes)
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="space-y-3 mt-4">
                  {viewContent.description?.map((point, index) => (
                    <div
                      key={index}
                      className="prose prose-sm max-w-none p-3 bg-gray-50 rounded"
                      dangerouslySetInnerHTML={{ __html: point }}
                    />
                  ))}
                </div>
              )}
              <p>
                <strong>Date:</strong> {new Date(viewContent.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-6 flex justify-end"></div>
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

export default Wallfeed;
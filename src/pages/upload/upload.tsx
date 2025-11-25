import React, { useState, useEffect } from "react";
import TabNavigation from "../../component/TabNavigation";
import CreateCollectionForm from "../../component/CreateCollectionForm";
import UploadMediaForm from "../../component/UploadMediaForm";
import CollectionList from "../../component/CollectionList";
import EditMediaModal from "../../component/EditMediaModal";
import { DeleteConfirmationModal } from "../../components/events/DeleteConfirmationModal";
import MediaViewerModal from "../../component/MediaViewerModal";
import EditCollectionModal from "../../component/EditCollectionModal";
import collectionApi from "../../api/knowldgehub";
import { toast } from "react-toastify";



const useMediaDashboard = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [savedCollections, setSavedCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>("all");
  const [selectedExpertType, setSelectedExpertType] = useState<string>("");
  const [viewerModal, setViewerModal] = useState<{ open: boolean; url: string; type: string }>({
    open: false,
    url: "",
    type: "",
  });
  const [editMedia, setEditMedia] = useState<any>(null);
  const [editCollection, setEditCollection] = useState<any>(null);
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [mediaToDelete, setMediaToDelete] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [showCreateCollection, setShowCreateCollection] = useState<boolean>(true);

  const fetchAllCollections = async () => {
    setLoading(true);
    try {
      const response = await collectionApi.fetchAllCollections();
      setCollections(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch collections");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedCollections = async () => {
    setLoading(true);
    try {
      const response = await collectionApi.fetchSavedCollections();
      setSavedCollections(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch saved collections");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionsByCategory = async (category: string) => {
    setLoading(true);
    try {
      const response = await collectionApi.getCollectionsByTypeAndSubtype({ type: category });
      setCollections(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch collections by category");
      toast.error(err.response?.data?.message || "Failed to fetch collections by category", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const uploadMedia = async (formData: FormData) => {
    setLoading(true);
    try {
      const response = await collectionApi.uploadMedia(formData, {
        onUploadProgress: (progressEvent: ProgressEvent) => {
          const percentCompleted = parseFloat(
            ((progressEvent.loaded / (progressEvent.total || 1)) * 100).toFixed(2)
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      });
      const { collectionId, media } = response.data;
      setCollections((prev) =>
        prev.map((col) =>
          col._id === collectionId ? { ...col, subItems: [...(col.subItems || []), ...media] } : col
        )
      );
      toast.success("Media uploaded successfully", { position: "top-center" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload media");
      toast.error(err.response?.data?.message || "Failed to upload media", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    setLoading(true);
    try {
      await collectionApi.deleteMedia(mediaId);
      setCollections((prev) =>
        prev.map((col) => ({
          ...col,
          subItems: col.subItems.filter((item: any) => item._id !== mediaId),
        }))
      );
      setSavedCollections((prev) =>
        prev.map((col) => ({
          ...col,
          subItems: col.subItems.filter((item: any) => item._id !== mediaId),
        }))
      );
      toast.success("Media deleted successfully", { position: "top-center" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete media");
      toast.error(err.response?.data?.message || "Failed to delete media", { position: "top-center" });
    } finally {
      setLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    setLoading(true);
    try {
      await collectionApi.deleteCollection(collectionId);
      setCollections((prev) => prev.filter((col) => col._id !== collectionId));
      setSavedCollections((prev) => prev.filter((col) => col._id !== collectionId));
      toast.success("Collection deleted successfully", { position: "top-center" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete collection");
      toast.error(err.response?.data?.message || "Failed to delete collection", { position: "top-center" });
    } finally {
      setLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Fixed: Remove currentUserId parameter - get it inside the function
  const handleSaveCollection = async (collection: any) => {
    try {
      const currentUserId = localStorage.getItem('userId') || 'current-user-id';
      const response = await collectionApi.toggleSaveCollection(collection._id);
      console.log("toggleSaveCollection response:", response);

      const savedCollection = response.data;
      const message = response.message || "Collection updated";

      const isSaved = savedCollection.savedBy?.some(
        (item: any) => item.userId === currentUserId
      );

      setSavedCollections((prev) =>
        isSaved
          ? [...prev.filter((col) => col._id !== savedCollection._id), savedCollection]
          : prev.filter((col) => col._id !== savedCollection._id)
      );

      setTimeout(() => {
        toast.success(message, { position: "top-center" });
      }, 0);
    } catch (err: any) {
      console.error("handleSaveCollection error:", err);
      toast.error(err.response?.data?.message || "Failed to save collection", {
        position: "top-center",
      });
      throw err;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [collectionsData, savedCollectionsData] = await Promise.all([
          collectionApi.fetchAllCollections(),
          collectionApi.fetchSavedCollections(),
        ]);
        setCollections(collectionsData.data || []);
        setSavedCollections(savedCollectionsData.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return {
    collections,
    setCollections,
    savedCollections,
    setSavedCollections,
    loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCollectionType,
    setSelectedCollectionType,
    selectedExpertType,
    setSelectedExpertType,
    viewerModal,
    setViewerModal,
    editMedia,
    setEditMedia,
    editCollection,
    setEditCollection,
    isEditCollectionModalOpen,
    setIsEditCollectionModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    mediaToDelete,
    setMediaToDelete,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    expandedCollections,
    setExpandedCollections,
    showCreateCollection,
    setShowCreateCollection,
    uploadMedia,
    deleteMedia,
    deleteCollection,
    fetchCollectionsByCategory,
    handleSaveCollection,
    fetchAllCollections,
    fetchSavedCollections,
  };
};

const UploadPage: React.FC = () => {
  const {
    collections,
    setCollections,
    savedCollections,
    setSavedCollections,
    loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCollectionType,
    setSelectedCollectionType,
    selectedExpertType,
    setSelectedExpertType,
    viewerModal,
    setViewerModal,
    editMedia,
    setEditMedia,
    editCollection,
    setEditCollection,
    isEditCollectionModalOpen,
    setIsEditCollectionModalOpen,
    setIsEditModalOpen,
    mediaToDelete,
    setMediaToDelete,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    expandedCollections,
    setExpandedCollections,
    setShowCreateCollection,
    uploadMedia,
    deleteMedia,
    deleteCollection,
    fetchCollectionsByCategory,
    handleSaveCollection,
    fetchAllCollections,
    fetchSavedCollections,
  } = useMediaDashboard();

  const handleDeleteConfirm = () => {
    if (mediaToDelete?._id) {
      if (mediaToDelete.type === "collection") {
        deleteCollection(mediaToDelete._id);
      } else {
        deleteMedia(mediaToDelete._id);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "upload" && (
        <div className="space-y-6">
          <CreateCollectionForm 
            setCollections={setCollections} 
            setShowCreateCollection={setShowCreateCollection}
          />
          <UploadMediaForm collections={collections} uploadMedia={uploadMedia} />
        </div>
      )}

      {activeTab === "library" && (
        <CollectionList
          collections={collections}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedCollectionType={selectedCollectionType}
          setSelectedCollectionType={setSelectedCollectionType}
          selectedExpertType={selectedExpertType}
          setSelectedExpertType={setSelectedExpertType}
          fetchCollectionsByCategory={fetchCollectionsByCategory}
          fetchAllCollections={fetchAllCollections}
          handleSaveCollection={handleSaveCollection}
          setViewerModal={setViewerModal}
          setEditMedia={setEditMedia}
          setIsEditModalOpen={setIsEditModalOpen}
          setMediaToDelete={setMediaToDelete}
          setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
          expandedCollections={expandedCollections}
          setExpandedCollections={setExpandedCollections}
          setCollections={setCollections}
          setSavedCollections={setSavedCollections}
          setEditCollection={setEditCollection}
          setIsEditCollectionModalOpen={setIsEditCollectionModalOpen}
        />
      )}

      {activeTab === "saved" && (
        <CollectionList
          collections={savedCollections}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedCollectionType={selectedCollectionType}
          setSelectedCollectionType={setSelectedCollectionType}
          selectedExpertType={selectedExpertType}
          setSelectedExpertType={setSelectedExpertType}
          fetchCollectionsByCategory={fetchCollectionsByCategory}
          fetchAllCollections={fetchSavedCollections}
          handleSaveCollection={handleSaveCollection}
          setViewerModal={setViewerModal}
          setEditMedia={setEditMedia}
          setIsEditModalOpen={setIsEditModalOpen}
          setMediaToDelete={setMediaToDelete}
          setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
          expandedCollections={expandedCollections}
          setExpandedCollections={setExpandedCollections}
          setCollections={setCollections}
          setSavedCollections={setSavedCollections}
          setEditCollection={setEditCollection}
          setIsEditCollectionModalOpen={setIsEditCollectionModalOpen}
        />
      )}

      <EditMediaModal
        editMedia={editMedia}
        setEditMedia={setEditMedia}
        setCollections={setCollections}
        setSavedCollections={setSavedCollections}
        fetchAllCollections={fetchAllCollections}
        fetchSavedCollections={fetchSavedCollections}
        setIsEditModalOpen={setIsEditModalOpen}
      />

      {isEditCollectionModalOpen && (
        <EditCollectionModal
          editCollection={editCollection}
          setEditCollection={setEditCollection}
          setIsEditCollectionModalOpen={setIsEditCollectionModalOpen}
          setCollections={setCollections}
          setSavedCollections={setSavedCollections}
          fetchAllCollections={fetchAllCollections}
          fetchSavedCollections={fetchSavedCollections}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={loading}
      />

      <MediaViewerModal viewerModal={viewerModal} setViewerModal={setViewerModal} />
    </div>
  );
};

export default UploadPage;
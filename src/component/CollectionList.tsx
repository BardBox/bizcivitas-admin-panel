import React, { useState } from 'react';
import { Save, Edit2, Trash2 } from 'lucide-react';
import CollectionItem from './CollectionItem';
import collectionApi from '../api/knowldgehub';
import { toast } from 'react-toastify';

const currentUserId = localStorage.getItem('userId') || 'current-user-id';

interface Collection {
  _id: string;
  type: 'expert' | 'knowledge' | 'membership' | 'resource' | 'express';
  expertType?: 'Business Excellence' | 'Employee Development';
  title: string;
  description: string;
  thumbnailUrl: string;
  createdBy: { _id: string; fname: string; lname: string; email: string };
  submittedBy?: { _id: string; fname: string; lname: string; email: string };
  author: string;
  subItems?: any[];
  tags?: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  savedBy?: { userId: string; savedDate: string }[];
}

interface CollectionListProps {
  collections: Collection[];
  loading: boolean;
  searchQuery: string;
  error?: string | null;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedCollectionType: string;
  setSelectedCollectionType: React.Dispatch<React.SetStateAction<string>>;
  selectedExpertType: string;
  setSelectedExpertType: React.Dispatch<React.SetStateAction<string>>;
  fetchCollectionsByCategory: (category: string) => Promise<void>;
  fetchAllCollections: () => Promise<any>;
  handleSaveCollection: (collection: Collection) => Promise<void>;
  setViewerModal: React.Dispatch<React.SetStateAction<{ open: boolean; url: string; type: string }>>;
  setEditMedia: React.Dispatch<React.SetStateAction<any>>;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  setSavedCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  setEditCollection: React.Dispatch<React.SetStateAction<Collection | null>>;
  setIsEditCollectionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expandedCollections: string[];
  setExpandedCollections: React.Dispatch<React.SetStateAction<string[]>>;
  setMediaToDelete: React.Dispatch<React.SetStateAction<Collection | null>>;
  setIsDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CollectionList: React.FC<CollectionListProps> = ({
  collections,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,

  selectedCollectionType,
  setSelectedCollectionType,
  selectedExpertType,
  setSelectedExpertType,
  fetchAllCollections,
  handleSaveCollection,
  setViewerModal,
  setEditMedia,
  setIsEditModalOpen,
  setCollections,
  setSavedCollections,
  setEditCollection,
  setIsEditCollectionModalOpen,
  expandedCollections,
  setExpandedCollections,
  // setMediaToDelete,
  // setIsDeleteConfirmOpen,
}) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Collection | null>(null);

  const filteredCollections = collections.filter(collection => {
    const matchesSearch =
      collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.subItems?.some(
        item =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesCategory =
      selectedCategory === 'all' || collection.subItems?.some(item => item.folder === selectedCategory);

    const matchesType =
      selectedCollectionType === 'all' || collection.type === selectedCollectionType;

    const matchesExpertType =
      selectedExpertType === '' || collection.expertType === selectedExpertType;

    return matchesSearch && matchesCategory && matchesType && matchesExpertType;
  });

  const handleToggleSave = async (collection: Collection) => {
    try {
      await handleSaveCollection(collection);
      const collectionsRes = await fetchAllCollections();
      setCollections(collectionsRes.data || []);
      const savedRes = await collectionApi.fetchSavedCollections();
      setSavedCollections(savedRes.data || []);
    } catch (err: any) {
      console.error("Failed in handleToggleSave:", err);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await collectionApi.deleteCollection(collectionId);
      setCollections(prev => prev.filter(col => col._id !== collectionId));
      setSavedCollections(prev => prev.filter(col => col._id !== collectionId));
      toast.success("Collection deleted successfully", { position: "top-center" });
    } catch (err: any) {
      console.error("deleteCollection error:", err);
      toast.error(err.response?.data?.message || "Failed to delete collection", { position: "top-center" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setMediaToDelete(null);
    }
  };

  const handleEditClick = (collection: Collection) => {
    setEditCollection(collection);
    setIsEditCollectionModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 bg-white shadow-lg rounded-lg w-full max-w-7xl mx-auto">
      {/* Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="collectionType" className="block text-sm font-medium text-gray-700 mb-1">
            Collection Type
          </label>
          <select
            id="collectionType"
            value={selectedCollectionType}
            onChange={(e) => setSelectedCollectionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="expert">Expert</option>
            <option value="knowledge">Knowledge</option>
            <option value="membership">Membership</option>
            <option value="resource">Resource</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="expertType" className="block text-sm font-medium text-gray-700 mb-1">
            Expert Type
          </label>
          <select
            id="expertType"
            value={selectedExpertType}
            onChange={(e) => setSelectedExpertType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Expert Types</option>
            <option value="Business Excellence">Business Excellence</option>
            <option value="Employee Development">Employee Development</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCollections.length === 0 ? (
        <p className="text-center text-gray-600">No collections found.</p>
      ) : (
        <div className="space-y-6">
          {filteredCollections.map(collection => (
            <div key={collection._id} className="p-4 shadow-sm hover:shadow-md transition-shadow">
              <CollectionItem
                collection={collection}
                expandedCollections={expandedCollections}
                setExpandedCollections={setExpandedCollections}
                handleSaveCollection={handleToggleSave}
                setViewerModal={setViewerModal}
                setEditMedia={setEditMedia}
                setIsEditModalOpen={setIsEditModalOpen}
                setMediaToDelete={setMediaToDelete}
                setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
              />
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={() => handleEditClick(collection)}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Edit Collection"
                >
                  <Edit2 size={16} />
                  <span className="text-sm">Edit</span>
                </button>

                <button
                  onClick={() => {
                    setMediaToDelete(collection);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Delete Collection"
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Delete</span>
                </button>

                <button
                  onClick={() => handleToggleSave(collection)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-md transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 ${
                    collection.savedBy?.some(s => s.userId === currentUserId)
                      ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-gray-500'
                  }`}
                  title={collection.savedBy?.some(s => s.userId === currentUserId) ? 'Unsave Collection' : 'Save Collection'}
                >
                  <Save
                    size={16}
                    className={collection.savedBy?.some(s => s.userId === currentUserId) ? 'text-white' : 'text-gray-600'}
                  />
                  <span className="text-sm">{collection.savedBy?.some(s => s.userId === currentUserId) ? 'Unsave' : 'Save'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDeleteConfirmOpen && mediaToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete "{mediaToDelete.title}"?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCollection(mediaToDelete._id)}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionList;
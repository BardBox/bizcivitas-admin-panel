import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import collectionApi from '../api/knowldgehub';
import { toast } from 'react-toastify';
import { useVisibility } from '../context/VisibilityContext';

interface Collection {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  type: 'expert' | 'knowledge' | 'membership' | 'resource';
  expertType?: 'Business Excellence' | 'Employee Development';
  submittedBy?: { fname: string; lname: string; email: string };
  author?: string;
  newThumbnail?: File | null;
}

interface EditCollectionModalProps {
  editCollection: Collection | null;
  setEditCollection: React.Dispatch<React.SetStateAction<Collection | null>>;
  setIsEditCollectionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  setSavedCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  fetchAllCollections: () => Promise<void>;
  fetchSavedCollections: () => Promise<void>;
}

const collectionTypes = [
  { value: 'expert', label: 'Expert' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'membership', label: 'Membership' },
  { value: 'resource', label: 'Resource' },
];

const expertTypes = [
  { value: '', label: 'All Expert Types' },
  { value: 'Business Excellence', label: 'Business Excellence' },
  { value: 'Employee Development', label: 'Employee Development' },
];

const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  editCollection,
  setEditCollection,
  setIsEditCollectionModalOpen,
  setCollections,
  setSavedCollections,
  fetchAllCollections,
  fetchSavedCollections,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSidebarAndHeaderVisibility } = useVisibility();

  useEffect(() => {
    if (editCollection) setSidebarAndHeaderVisibility(false);
    return () => setSidebarAndHeaderVisibility(true);
  }, [editCollection, setSidebarAndHeaderVisibility]);

  if (!editCollection) return null;

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsEditCollectionModalOpen(false);
      setEditCollection(null);
    }
  };

  const handleEdit = async () => {
    if (!editCollection._id || !editCollection.title.trim()) {
      toast.error('Collection ID or Title is missing', { position: 'top-center' });
      return;
    }

    const formData = new FormData();
    formData.append('title', editCollection.title);
    formData.append('description', editCollection.description || '');
    formData.append('type', editCollection.type);
    if (editCollection.expertType) formData.append('expertType', editCollection.expertType);
    if (editCollection.type === 'membership' && editCollection.submittedBy) {
      formData.append('submittedBy', JSON.stringify(editCollection.submittedBy));
    }
    if (editCollection.author) formData.append('author', editCollection.author);
    if (editCollection.newThumbnail) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(editCollection.newThumbnail.type)) {
        toast.error('Thumbnail must be JPEG, PNG, or WebP', { position: 'top-center' });
        return;
      }
      formData.append('thumbnail', editCollection.newThumbnail);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await collectionApi.updateCollection(editCollection._id, formData);
      const updatedCollection = response.data || response;

      if (!updatedCollection._id) throw new Error('Invalid collection data returned from server');

      setCollections(prev => prev.map(c => (c._id === updatedCollection._id ? updatedCollection : c)));
      setSavedCollections(prev => prev.map(c => (c._id === updatedCollection._id ? updatedCollection : c)));

      setIsEditCollectionModalOpen(false);
      setEditCollection(null);

      toast.success('Collection updated successfully', { position: 'top-center' });

      await Promise.all([fetchAllCollections(), fetchSavedCollections()]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update collection';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'top-center' });
      console.error('updateCollection error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-[1000]"
      onClick={handleOutsideClick}
    >
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Collection</h3>
        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        <Select
          value={collectionTypes.find(opt => opt.value === editCollection.type)}
          onChange={option => setEditCollection(prev => ({ ...prev!, type: option?.value as any }))}
          options={collectionTypes}
          placeholder="Select Collection Type"
          className="mb-4"
        />

        {editCollection.type === 'expert' && (
          <Select
            value={expertTypes.find(opt => opt.value === editCollection.expertType)}
            onChange={option => setEditCollection(prev => ({ ...prev!, expertType: option?.value as any }))}
            options={expertTypes}
            placeholder="Select Expert Type"
            className="mb-4"
          />
        )}

        <input
          type="text"
          value={editCollection.title}
          onChange={e => setEditCollection(prev => ({ ...prev!, title: e.target.value }))}
          placeholder="Enter collection title"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <textarea
          value={editCollection.description}
          onChange={e => setEditCollection(prev => ({ ...prev!, description: e.target.value }))}
          placeholder="Enter collection description"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <input
          type="text"
          value={editCollection.author || ''}
          onChange={e => setEditCollection(prev => ({ ...prev!, author: e.target.value || undefined }))}
          placeholder="Enter author name"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        {editCollection.type === 'membership' && (
          <div className="mb-4 space-y-2">
            <input
              type="text"
              value={editCollection.submittedBy?.email || ''}
              onChange={e =>
                setEditCollection(prev => ({ ...prev!, submittedBy: { ...prev!.submittedBy!, email: e.target.value } }))
              }
              placeholder="Submitter email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={editCollection.submittedBy?.fname || ''}
              onChange={e =>
                setEditCollection(prev => ({ ...prev!, submittedBy: { ...prev!.submittedBy!, fname: e.target.value } }))
              }
              placeholder="Submitter first name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={editCollection.submittedBy?.lname || ''}
              onChange={e =>
                setEditCollection(prev => ({ ...prev!, submittedBy: { ...prev!.submittedBy!, lname: e.target.value } }))
              }
              placeholder="Submitter last name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {editCollection.thumbnailUrl && (
          <img
            src={editCollection.thumbnailUrl}
            alt="Current thumbnail"
            className="w-full max-h-48 object-contain rounded-lg mb-4"
          />
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={e => setEditCollection(prev => ({ ...prev!, newThumbnail: e.target.files?.[0] || null }))}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setIsEditCollectionModalOpen(false); setEditCollection(null); }}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCollectionModal;

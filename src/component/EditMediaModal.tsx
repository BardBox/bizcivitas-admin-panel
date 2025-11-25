import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Media {
  _id: string;
  title: string;
  description?: string;
  folder: 'pdfs' | 'tutorial-videos' | 'recordings';
  type: 'pdf' | 'video';
  thumbnailUrl?: string;
  newThumbnail?: File | null;
  downloadable?: boolean; // PDFs only
}

interface Collection {
  _id: string;
  type: 'expert' | 'knowledge' | 'membership' | 'resource';
  expertType?: 'Business Excellence' | 'Employee Development';
  title: string;
  description: string;
  thumbnailUrl: string;
  createdBy: { _id: string; fname: string; lname: string; email: string };
  submittedBy?: { _id: string; fname: string; lname: string; email: string };
  author: string;
  subItems?: Media[];
  tags?: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  savedBy?: { userId: string; savedDate: string }[];
}

interface EditMediaModalProps {
  editMedia: Media | null;
  setEditMedia: React.Dispatch<React.SetStateAction<Media | null>>;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  setSavedCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  fetchAllCollections: () => Promise<void>;
  fetchSavedCollections: () => Promise<void>;
}

import collectionApi from '../api/knowldgehub';
import { useVisibility } from '../context/VisibilityContext';

const EditMediaModal: React.FC<EditMediaModalProps> = ({
  editMedia,
  setEditMedia,
  setIsEditModalOpen,
  setCollections,
  setSavedCollections,
  fetchAllCollections,
  fetchSavedCollections,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { setSidebarAndHeaderVisibility } = useVisibility();

  useEffect(() => {
    if (editMedia) {
      setSidebarAndHeaderVisibility(false);
      return () => setSidebarAndHeaderVisibility(true);
    }
  }, [editMedia, setSidebarAndHeaderVisibility]);

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsEditModalOpen(false);
      setEditMedia(null);
    }
  };

  const handleEdit = async () => {
    if (!editMedia?.title) {
      toast.error('Title is required', { position: 'top-center' });
      return;
    }

    const formData = new FormData();
    formData.append('title', editMedia.title);
    formData.append('description', editMedia.description || '');
    if (editMedia.type === 'pdf' && editMedia.downloadable !== undefined) {
      formData.append('downloadable', editMedia.downloadable.toString());
    }
    if (editMedia.newThumbnail) {
      const allowedThumbnailTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedThumbnailTypes.includes(editMedia.newThumbnail.type)) {
        toast.error('Thumbnail must be a JPEG, PNG, or WebP image', { position: 'top-center' });
        return;
      }
      formData.append('thumbnail', editMedia.newThumbnail);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedMedia = await collectionApi.updateMedia(editMedia._id, formData);

      // Update collections in state
      setCollections(prev =>
        prev.map(collection => ({
          ...collection,
          subItems: collection.subItems?.map((item: Media) =>
            item._id === editMedia._id ? updatedMedia : item
          ) || [],
        }))
      );
      setSavedCollections(prev =>
        prev.map(collection => ({
          ...collection,
          subItems: collection.subItems?.map((item: Media) =>
            item._id === editMedia._id ? updatedMedia : item
          ) || [],
        }))
      );

      setIsEditModalOpen(false);
      setEditMedia(null);
      toast.success('Media updated successfully', { position: 'top-center' });
      await Promise.all([fetchAllCollections(), fetchSavedCollections()]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update media';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  if (!editMedia) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-[1000]"
      onClick={handleOutsideClick}
    >
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Media</h3>
        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        <input
          type="text"
          value={editMedia.title}
          onChange={e => setEditMedia(prev => ({ ...prev!, title: e.target.value }))}
          placeholder="Enter media title"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <textarea
          value={editMedia.description}
          onChange={e => setEditMedia(prev => ({ ...prev!, description: e.target.value }))}
          placeholder="Enter media description"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        {editMedia.type === 'pdf' && (
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={editMedia.downloadable || false}
              onChange={e => setEditMedia(prev => ({ ...prev!, downloadable: e.target.checked }))}
              className="form-checkbox h-5 w-5"
            />
            <span>Allow PDF Download</span>
          </label>
        )}

        {editMedia.thumbnailUrl && (
          <img
            src={editMedia.thumbnailUrl}
            alt="Current thumbnail"
            className="w-full max-h-48 object-contain rounded-lg mb-4"
          />
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={e => {
            const selectedThumbnail = e.target.files?.[0] || null;
            setEditMedia(prev => ({ ...prev!, newThumbnail: selectedThumbnail }));
          }}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setIsEditModalOpen(false);
              setEditMedia(null);
            }}
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

export default EditMediaModal;
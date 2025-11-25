import { ChevronUp, ChevronDown } from 'lucide-react';
import MediaItem from './MediaItem';

interface User {
  _id: string;
  fname: string;
  lname: string;
  email: string;
}

interface Media {
  _id: string;
  title: string;
  description?: string;
  folder: 'pdfs' | 'tutorial-videos' | 'recordings';
  type: 'pdf' | 'video';
  thumbnailUrl?: string;
  url?: string;
  embedLink?: string;
  createdAt: string;
  uploadedBy: { _id: string; fname?: string; lname?: string; email?: string };
  sizeInBytes?: number;
  vimeoId?: string;
  status?: string;
  newThumbnail?: File | null;
}

interface Collection {
  _id: string;
  type: 'expert' | 'knowledge' | 'membership' | 'resource' | 'express';
  expertType?: 'Business Excellence' | 'Employee Development';
  title: string;
  description: string;
  thumbnailUrl: string;
  createdBy: User;
  submittedBy?: User;
  author: string;
  subItems?: Media[];
  tags?: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  savedBy?: { userId: string; savedDate: string }[];
}

interface CollectionItemProps {
  collection: Collection;
  expandedCollections: string[];
  setExpandedCollections: React.Dispatch<React.SetStateAction<string[]>>;
  handleSaveCollection: (collection: Collection) => Promise<void>;
  setViewerModal: React.Dispatch<React.SetStateAction<{ open: boolean; url: string; type: string }>>;
  setEditMedia: React.Dispatch<React.SetStateAction<any>>;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMediaToDelete: React.Dispatch<React.SetStateAction<any>>;
  setIsDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  expandedCollections,
  setExpandedCollections,
  setViewerModal,
  setEditMedia,
  setIsEditModalOpen,
  setMediaToDelete,
  setIsDeleteConfirmOpen,
}) => {
  // Expand/Collapse toggle
  const toggleCollection = () => {
    setExpandedCollections(prev =>
      prev.includes(collection._id)
        ? prev.filter(id => id !== collection._id)
        : [...prev, collection._id]
    );
  };

  return (
    <div>
      {/* Thumbnail */}
      <div className="mb-4 p-4 rounded-lg border">
        <img
          src={collection.thumbnailUrl || ''}
          alt={`${collection.title} thumbnail`}
          className="w-full h-48 object-cover rounded-md"
        />
      </div>

      {/* Collection Details */}
      <div className="flex items-center justify-between mb-4 p-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{collection.title}</h3>
            <p className="text-sm text-gray-600">{collection.description}</p>
            <p className="text-sm text-gray-500">
              Type: {collection.type}{collection.expertType ? ` (${collection.expertType})` : ''}
            </p>
            <p className="text-sm text-gray-500">
              Created: {new Date(collection.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              Created By: {collection.createdBy.fname} {collection.createdBy.lname} ({collection.createdBy.email})
            </p>
            {collection.submittedBy && (
              <p className="text-sm text-gray-500">
                Submitted By: {collection.submittedBy.fname} {collection.submittedBy.lname} ({collection.submittedBy.email})
              </p>
            )}
            <p className="text-sm text-gray-500">Author: {collection.author || 'Unknown'}</p>
            {collection.tags && collection.tags.length > 0 && (
              <p className="text-sm text-gray-500">Tags: {collection.tags.join(', ')}</p>
            )}
            <p className="text-sm text-gray-500">
              Saved By: {collection.savedBy?.length || 0} users
            </p>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button onClick={toggleCollection} className="p-2 hover:bg-gray-200 rounded-md">
          {expandedCollections.includes(collection._id) ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
      </div>

      {/* Sub Items */}
      {expandedCollections.includes(collection._id) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!collection.subItems || collection.subItems.length === 0) ? (
            <p className="text-gray-600">No media items in this collection.</p>
          ) : (
            collection.subItems.map(file => (
              <MediaItem
                key={file._id}
                file={file}
                setViewerModal={setViewerModal}
                setEditMedia={setEditMedia}
                setIsEditModalOpen={setIsEditModalOpen}
                setMediaToDelete={setMediaToDelete}
                setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionItem;
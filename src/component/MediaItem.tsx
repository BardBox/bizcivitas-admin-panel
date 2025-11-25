import { Eye, Edit3, Trash2 } from 'lucide-react';

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

interface MediaItemProps {
  file: Media;
  setViewerModal: React.Dispatch<React.SetStateAction<{ open: boolean; url: string; type: string }>>;
  setEditMedia: React.Dispatch<React.SetStateAction<Media | null>>;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMediaToDelete: React.Dispatch<React.SetStateAction<Media | null>>;
  setIsDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const MediaItem: React.FC<MediaItemProps> = ({
  file,
  setViewerModal,
  setEditMedia,
  setIsEditModalOpen,
  setMediaToDelete,
  setIsDeleteConfirmOpen,
}) => {
  const uploadedBy = file.uploadedBy || { _id: '', fname: '', lname: '', email: '' };
  const uploadedByName =
    uploadedBy.fname && uploadedBy.lname
      ? `${uploadedBy.fname} ${uploadedBy.lname}`
      : uploadedBy.email || 'Unknown';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {file.thumbnailUrl && file.type === 'video' && (
        <div className="relative w-full h-48">
          <img
            src={file.thumbnailUrl}
            alt={`${file.title} thumbnail`}
            className="w-full h-full object-cover rounded-t-xl transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white text-lg font-semibold">View Video</span>
          </div>
        </div>
      )}

      <div className="p-5">
        <h4 className="text-xl font-bold text-gray-900 truncate mb-2">{file.title}</h4>
        {file.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{file.description}</p>
        )}
        <div className="space-y-2 text-sm text-gray-500">
          <p><strong className="text-gray-700">Type:</strong> {file.type}</p>
          <p><strong className="text-gray-700">Created:</strong> {new Date(file.createdAt).toLocaleDateString()}</p>
          <p><strong className="text-gray-700">Uploaded By:</strong> {uploadedByName}</p>
          {file.type === 'pdf' && (
            <p><strong className="text-gray-700">Size:</strong> {formatFileSize(file.sizeInBytes)}</p>
          )}
          {file.vimeoId && (
            <p><strong className="text-gray-700">Vimeo ID:</strong> {file.vimeoId}</p>
          )}
          <p><strong className="text-gray-700">Status:</strong> {file.status || 'Unknown'}</p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => {
              const url = file.type === 'video' ? file.embedLink || file.url || '' : file.url || '';
              setViewerModal({
                open: true,
                url,
                type: file.type,
              });
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            title="View"
          >
            <Eye size={18} />
          </button>

          <button
            onClick={() => {
              setEditMedia({ ...file, newThumbnail: null });
              setIsEditModalOpen(true);
            }}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            title="Edit"
          >
            <Edit3 size={18} />
          </button>

          <button
            onClick={() => {
              setMediaToDelete(file);
              setIsDeleteConfirmOpen(true);
            }}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaItem;
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useVisibility } from '../context/VisibilityContext';

interface MediaViewerModalProps {
  viewerModal: { open: boolean; url: string; type: string };
  setViewerModal: React.Dispatch<React.SetStateAction<{ open: boolean; url: string; type: string }>>;
}

const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ viewerModal, setViewerModal }) => {
  const { setSidebarAndHeaderVisibility } = useVisibility();

  // Hide sidebar and header when modal is open, restore when it closes
  useEffect(() => {
    if (viewerModal.open) {
      setSidebarAndHeaderVisibility(false);
      return () => {
        setSidebarAndHeaderVisibility(true);
      };
    }
  }, [viewerModal.open, setSidebarAndHeaderVisibility]);

  if (!viewerModal.open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000] p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {viewerModal.type === 'video' ? 'Video Player' : 'PDF Viewer'}
          </h3>
          <button
            onClick={() => setViewerModal({ open: false, url: '', type: '' })}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {viewerModal.type === 'video' ? (
            <iframe
              src={viewerModal.url}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Video Player"
              className="w-full h-64 sm:h-96"
            />
          ) : (
            <iframe
              src={viewerModal.url}
              className="w-full h-64 sm:h-96"
              title="PDF Viewer"
              frameBorder="0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaViewerModal;
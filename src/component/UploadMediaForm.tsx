import { useRef, useState } from "react";
import { Upload, Video, FileText, Trash2 } from "lucide-react";
import Select from "react-select";
import { toast } from "react-toastify";

interface Media {
  _id: string;
  title: string;
  description?: string;
  folder: "pdfs" | "tutorial-videos" | "recordings";
  type: "pdf" | "video";
  thumbnailUrl?: string;
  newThumbnail?: File | null;
  downloadable?: boolean;
}

interface UploadForm {
  collectionId: string;
  description: string;
  videos: File[];
  pdfs: File[];
  videoTitles: string[];
  pdfTitles: string[];
  thumbnails: File[];
  pdfDownloadable: boolean;
}

interface Collection {
  _id: string;
  title: string;
  type: "expert" | "knowledge" | "membership" | "resource" | "express";
  subItems?: Media[];
}

interface UploadMediaFormProps {
  collections: Collection[];
  uploadMedia: (formData: FormData, onProgress?: (progress: number) => void) => Promise<void>;
  onUploadComplete?: () => Promise<void>;
}

const UploadMediaForm: React.FC<UploadMediaFormProps> = ({
  collections,
  uploadMedia,
  onUploadComplete,
}) => {
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    collectionId: "",
    description: "",
    videos: [],
    pdfs: [],
    videoTitles: [],
    pdfTitles: [],
    thumbnails: [],
    pdfDownloadable: false,
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // File size limits (in bytes)
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB

  const getAllowedMediaTypes = (type: Collection["type"]) => {
    switch (type) {
      case "knowledge":
      case "express":
      case "membership":
        return { allowVideo: true, allowPDF: false };
      case "resource":
        return { allowVideo: false, allowPDF: true };
      default:
        return { allowVideo: true, allowPDF: true };
    }
  };

  const selectedCollection = collections.find(
    (col) => col._id === uploadForm.collectionId
  );
  const allowedMedia = selectedCollection
    ? getAllowedMediaTypes(selectedCollection.type)
    : { allowVideo: true, allowPDF: true };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.collectionId) {
      toast.error("Please select a collection", { position: "top-center" });
      return;
    }
    if (uploadForm.videos.length === 0 && uploadForm.pdfs.length === 0) {
      toast.error("Please select at least one video or PDF file", {
        position: "top-center",
      });
      return;
    }
    if (
      uploadForm.videos.length > 0 &&
      uploadForm.videos.length !== uploadForm.videoTitles.length
    ) {
      toast.error("Please provide a title for each video", {
        position: "top-center",
      });
      return;
    }
    if (
      uploadForm.pdfs.length > 0 &&
      uploadForm.pdfs.length !== uploadForm.pdfTitles.length
    ) {
      toast.error("Please provide a title for each PDF", {
        position: "top-center",
      });
      return;
    }
    if (
      uploadForm.videos.length > 0 &&
      uploadForm.videos.length !== uploadForm.thumbnails.length
    ) {
      toast.error("Please provide a thumbnail for each video", {
        position: "top-center",
      });
      return;
    }
    // Validate that all thumbnails are actual files (not null)
    if (
      uploadForm.videos.length > 0 &&
      uploadForm.thumbnails.some((thumb) => !thumb || !(thumb instanceof File))
    ) {
      toast.error("Please provide a thumbnail for each video. Thumbnails are required.", {
        position: "top-center",
      });
      return;
    }

    // Validate file sizes before upload
    for (const video of uploadForm.videos) {
      if (video.size > MAX_VIDEO_SIZE) {
        const sizeMB = (video.size / (1024 * 1024)).toFixed(2);
        toast.error(`Video "${video.name}" is too large (${sizeMB}MB). Maximum size is 100MB. Please compress or use a smaller file.`, {
          position: "top-center",
          autoClose: 7000,
        });
        return;
      }
    }

    for (const pdf of uploadForm.pdfs) {
      if (pdf.size > MAX_PDF_SIZE) {
        const sizeMB = (pdf.size / (1024 * 1024)).toFixed(2);
        toast.error(`PDF "${pdf.name}" is too large (${sizeMB}MB). Maximum size is 10MB. Please compress or use a smaller file.`, {
          position: "top-center",
          autoClose: 7000,
        });
        return;
      }
    }

    for (const thumbnail of uploadForm.thumbnails) {
      if (thumbnail && thumbnail.size > MAX_THUMBNAIL_SIZE) {
        const sizeMB = (thumbnail.size / (1024 * 1024)).toFixed(2);
        toast.error(`Thumbnail "${thumbnail.name}" is too large (${sizeMB}MB). Maximum size is 5MB. Please use a smaller image.`, {
          position: "top-center",
          autoClose: 7000,
        });
        return;
      }
    }

    const userId = localStorage.getItem("userId") || "current-user-id";
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Upload videos one at a time to prevent gateway timeout
      if (uploadForm.videos.length > 0) {
        const totalItems = uploadForm.videos.length + uploadForm.pdfs.length;
        let completedItems = 0;
        const failedVideos: string[] = [];

        for (let i = 0; i < uploadForm.videos.length; i++) {
          try {
            const videoFormData = new FormData();
            videoFormData.append("parentId", uploadForm.collectionId);
            videoFormData.append("description", uploadForm.description || "");
            videoFormData.append("videoTitles", JSON.stringify([uploadForm.videoTitles[i]]));
            videoFormData.append("videos", uploadForm.videos[i]);
            videoFormData.append("thumbnails", uploadForm.thumbnails[i]);
            videoFormData.append("uploadedBy", userId);

            await uploadMedia(videoFormData, (progress) => {
              // Calculate overall progress: completed items + current item progress
              const itemProgress = progress / 100; // Convert to 0-1 range
              const overallProgress = ((completedItems + itemProgress) / totalItems) * 100;
              setUploadProgress(Math.min(overallProgress, 100));
            });

            completedItems++;
            toast.success(`Video ${i + 1} of ${uploadForm.videos.length} uploaded successfully`, {
              position: "top-center",
              autoClose: 2000,
            });
          } catch (err: any) {
            failedVideos.push(uploadForm.videos[i].name);
            completedItems++; // Count as completed even if failed to continue progress
            toast.error(`Failed to upload video "${uploadForm.videos[i].name}": ${err.message || "Unknown error"}`, {
              position: "top-center",
              autoClose: 5000,
            });
          }
        }

        if (failedVideos.length > 0) {
          toast.warning(`${failedVideos.length} video(s) failed to upload: ${failedVideos.join(", ")}`, {
            position: "top-center",
            autoClose: 8000,
          });
        }
      }

      // Upload PDFs together (they're smaller, so less likely to timeout)
      if (uploadForm.pdfs.length > 0) {
        const pdfFormData = new FormData();
        pdfFormData.append("parentId", uploadForm.collectionId);
        pdfFormData.append("description", uploadForm.description || "");
        pdfFormData.append("pdfTitles", JSON.stringify(uploadForm.pdfTitles));
        if (allowedMedia.allowPDF)
          pdfFormData.append("pdfDownloadable", uploadForm.pdfDownloadable.toString());
        uploadForm.pdfs.forEach((file) => pdfFormData.append("pdfs", file));
        pdfFormData.append("uploadedBy", userId);

        const totalItems = uploadForm.videos.length + uploadForm.pdfs.length;
        const completedItems = uploadForm.videos.length;

        await uploadMedia(pdfFormData, (progress) => {
          // Calculate overall progress: completed videos + current PDF progress
          const pdfProgress = (progress / 100) * uploadForm.pdfs.length; // Each PDF gets equal weight
          const overallProgress = ((completedItems + pdfProgress) / totalItems) * 100;
          setUploadProgress(Math.min(overallProgress, 100));
        });

        toast.success(`PDF${uploadForm.pdfs.length > 1 ? 's' : ''} uploaded successfully`, {
          position: "top-center",
          autoClose: 2000,
        });
      }

      // Refetch collections after all uploads complete
      if (onUploadComplete) {
        await onUploadComplete();
      }

      setUploadForm({
        collectionId: "",
        description: "",
        videos: [],
        pdfs: [],
        videoTitles: [],
        pdfTitles: [],
        thumbnails: [],
        pdfDownloadable: false,
      });
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      setError(null);

      toast.success("All media uploaded successfully", { position: "top-center" });
    } catch (err: any) {
      const errorMessage =
        err.message || err.response?.data?.message || "Failed to upload media";
      setError(errorMessage);
      
      // Show specific error messages for timeout issues
      if (errorMessage.includes('timeout') || errorMessage.includes('Gateway timeout')) {
        toast.error(errorMessage, { 
          position: "top-center",
          autoClose: 8000,
        });
      } else {
        toast.error(errorMessage, { position: "top-center" });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Upload New Media
        </h2>
      </div>
      <form onSubmit={handleUpload} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-center text-red-600 font-medium">{error}</p>
            {error.includes('timeout') && (
              <p className="text-center text-red-500 text-sm mt-2">
                Tip: Try uploading a smaller file or check your internet connection.
              </p>
            )}
          </div>
        )}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection *
            </label>
            <Select
              options={collections.map((col) => ({
                value: col._id,
                label: col.title,
              }))}
              value={
                collections.find((col) => col._id === uploadForm.collectionId)
                  ? {
                      value: uploadForm.collectionId,
                      label: collections.find(
                        (col) => col._id === uploadForm.collectionId
                      )?.title,
                    }
                  : null
              }
              onChange={(option) =>
                setUploadForm((prev) => ({
                  ...prev,
                  collectionId: option?.value || "",
                  pdfDownloadable: false,
                }))
              }
              placeholder="Select Collection"
              className="w-full"
            />
          </div>

          {allowedMedia.allowVideo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Videos
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".mp4,.mov"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles: File[] = [];
                    files.forEach((file) => {
                      if (file.size > MAX_VIDEO_SIZE) {
                        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                        toast.error(`Video "${file.name}" is too large (${sizeMB}MB). Maximum size is 100MB.`, {
                          position: "top-center",
                          autoClose: 5000,
                        });
                      } else if (!file.type.startsWith("video/")) {
                        toast.error(`File "${file.name}" is not a valid video file.`, {
                          position: "top-center",
                        });
                      } else {
                        validFiles.push(file);
                      }
                    });
                    if (validFiles.length > 0) {
                      setUploadForm((prev) => {
                        // Filter out duplicates by name and size
                        const existing = prev.videos;
                        const newFiles = validFiles.filter(
                          (file) =>
                            !existing.some(
                              (f) => f.name === file.name && f.size === file.size
                            )
                        );
                        const updatedVideos = [...existing, ...newFiles];
                        const updatedVideoTitles = [
                          ...prev.videoTitles,
                          ...newFiles.map(() => ""),
                        ];
                        const updatedThumbnails = [
                          ...prev.thumbnails,
                          ...newFiles.map(() => null as any),
                        ];
                        return {
                          ...prev,
                          videos: updatedVideos,
                          videoTitles: updatedVideoTitles,
                          thumbnails: updatedThumbnails,
                        };
                      });
                    }
                  }}
                  className="hidden"
                  id="video-upload"
                  ref={videoInputRef}
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-gray-400">
                      <Video className="w-8 h-8 mx-auto" />
                    </div>
                    <div className="text-sm text-gray-600">
                      {uploadForm.videos.length > 0
                        ? `${uploadForm.videos.length} video(s) selected`
                        : "Click to select videos"}
                    </div>
                  </div>
                </label>
              </div>
              {uploadForm.videos.length > 0 && (
                <div className="mt-4 space-y-4">
                  {uploadForm.videos.map((file, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadForm((prev) => ({
                              ...prev,
                              videos: prev.videos.filter((_, i) => i !== index),
                              videoTitles: prev.videoTitles.filter(
                                (_, i) => i !== index
                              ),
                              thumbnails: prev.thumbnails.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={uploadForm.videoTitles[index] || ""}
                        onChange={(e) => {
                          const newTitles = [...uploadForm.videoTitles];
                          newTitles[index] = e.target.value;
                          setUploadForm((prev) => ({
                            ...prev,
                            videoTitles: newTitles,
                          }));
                        }}
                        placeholder={`Title for video ${index + 1}`}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thumbnail * <span className="text-red-500">(Required)</span>
                        </label>
                        <div className={`border-2 border-dashed rounded-lg p-2 text-center ${
                          uploadForm.thumbnails[index] 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-red-300 bg-red-50'
                        }`}>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const thumbnail = e.target.files?.[0] || null;
                            if (thumbnail) {
                              if (thumbnail.size > MAX_THUMBNAIL_SIZE) {
                                const sizeMB = (thumbnail.size / (1024 * 1024)).toFixed(2);
                                toast.error(`Thumbnail "${thumbnail.name}" is too large (${sizeMB}MB). Maximum size is 5MB.`, {
                                  position: "top-center",
                                  autoClose: 5000,
                                });
                                return;
                              }
                              if (!thumbnail.type.startsWith("image/")) {
                                toast.error(`File "${thumbnail.name}" is not a valid image file.`, {
                                  position: "top-center",
                                });
                                return;
                              }
                              const newThumbnails = [...uploadForm.thumbnails];
                              newThumbnails[index] = thumbnail;
                              setUploadForm((prev) => ({
                                ...prev,
                                thumbnails: newThumbnails,
                              }));
                            }
                          }}
                            className="hidden"
                            id={`thumbnail-upload-${index}`}
                            required
                          />
                          <label
                            htmlFor={`thumbnail-upload-${index}`}
                            className="cursor-pointer"
                          >
                            <div className={`text-sm ${
                              uploadForm.thumbnails[index]
                                ? 'text-green-700 font-medium'
                                : 'text-red-600 font-medium'
                            }`}>
                              {uploadForm.thumbnails[index]
                                ? `✓ ${uploadForm.thumbnails[index].name}`
                                : `⚠ Select thumbnail for video ${index + 1} (Required)`}
                            </div>
                          </label>
                          {uploadForm.thumbnails[index] && (
                            <img
                              src={URL.createObjectURL(
                                uploadForm.thumbnails[index]
                              )}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full max-h-32 object-contain rounded-lg mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {allowedMedia.allowPDF && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF / Excel / Word Files
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.xls,.xlsx,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles: File[] = [];
                    files.forEach((file) => {
                      if (file.size > MAX_PDF_SIZE) {
                        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                        toast.error(`File "${file.name}" is too large (${sizeMB}MB). Maximum size is 10MB.`, {
                          position: "top-center",
                          autoClose: 5000,
                        });
                      } else {
                        validFiles.push(file);
                      }
                    });
                    if (validFiles.length > 0) {
                      setUploadForm((prev) => {
                        // Filter out duplicates by name and size
                        const existing = prev.pdfs;
                        const newFiles = validFiles.filter(
                          (file) =>
                            !existing.some(
                              (f) => f.name === file.name && f.size === file.size
                            )
                        );
                        const updatedPdfs = [...existing, ...newFiles];
                        const updatedPdfTitles = [
                          ...prev.pdfTitles,
                          ...newFiles.map(() => ""),
                        ];
                        return {
                          ...prev,
                          pdfs: updatedPdfs,
                          pdfTitles: updatedPdfTitles,
                        };
                      });
                    }
                  }}
                  className="hidden"
                  id="pdf-upload"
                  ref={pdfInputRef}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-gray-400">
                      <FileText className="w-8 h-8 mx-auto" />
                    </div>
                    <div className="text-sm text-gray-600">
                      {uploadForm.pdfs.length > 0
                        ? `${uploadForm.pdfs.length} file(s) selected`
                        : "Click to select PDF, Excel, or Word files"}
                    </div>
                  </div>
                </label>
              </div>
              {uploadForm.pdfs.length > 0 && (
                <div className="mt-4 space-y-4">
                  {uploadForm.pdfs.map((file, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadForm((prev) => ({
                              ...prev,
                              pdfs: prev.pdfs.filter((_, i) => i !== index),
                              pdfTitles: prev.pdfTitles.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={uploadForm.pdfTitles[index] || ""}
                        onChange={(e) => {
                          const newTitles = [...uploadForm.pdfTitles];
                          newTitles[index] = e.target.value;
                          setUploadForm((prev) => ({
                            ...prev,
                            pdfTitles: newTitles,
                          }));
                        }}
                        placeholder={`Title for ${(() => {
                          const name = file.name.toLowerCase();
                          if (name.endsWith(".pdf")) return "PDF";
                          if (name.endsWith(".doc") || name.endsWith(".docx"))
                            return "Word Document";
                          if (name.endsWith(".xls") || name.endsWith(".xlsx"))
                            return "Excel File";
                          return "File";
                        })()}`}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}
              {allowedMedia.allowPDF &&
                selectedCollection?.type === "resource" && (
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={uploadForm.pdfDownloadable}
                        onChange={(e) =>
                          setUploadForm((prev) => ({
                            ...prev,
                            pdfDownloadable: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Allow PDFs to be downloadable
                    </label>
                  </div>
                )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isUploading ||
              !uploadForm.collectionId ||
              (uploadForm.videos.length === 0 &&
                uploadForm.pdfs.length === 0) ||
              (uploadForm.videos.length > 0 &&
                uploadForm.videos.length !== uploadForm.videoTitles.length) ||
              (uploadForm.pdfs.length > 0 &&
                uploadForm.pdfs.length !== uploadForm.pdfTitles.length) ||
              (uploadForm.videos.length > 0 &&
                uploadForm.videos.length !== uploadForm.thumbnails.length) ||
              (uploadForm.videos.length > 0 &&
                uploadForm.thumbnails.some((thumb) => !thumb || !(thumb instanceof File)))
            }
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading... {uploadProgress.toFixed(2)}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Media
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadMediaForm;

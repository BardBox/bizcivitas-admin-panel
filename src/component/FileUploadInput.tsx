import { useRef } from 'react';

interface FileUploadInputProps {
  id: string;
  accept: string;
  multiple?: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  files: File[];
  setFiles: (files: File[]) => void;
}

const FileUploadInput: React.FC<FileUploadInputProps> = ({ id, accept, multiple, label, icon: Icon, files, setFiles }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={e => {
          const selectedFiles = Array.from(e.target.files || []);
          setFiles(selectedFiles);
          if (inputRef.current) inputRef.current.value = '';
        }}
        className="hidden"
        id={id}
        ref={inputRef}
      />
      <label htmlFor={id} className="cursor-pointer">
        <div className="space-y-2">
          <div className="text-gray-400">
            <Icon className="w-8 h-8 mx-auto" />
          </div>
          <div className="text-sm text-gray-600">
            {files.length > 0 ? `${files.length} ${label}(s) selected` : `Click to select ${label}s`}
          </div>
        </div>
      </label>
    </div>
  );
};

export default FileUploadInput;
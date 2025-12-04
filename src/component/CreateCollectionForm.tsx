import React, { useRef, useState, useEffect } from 'react';
import { Plus, Upload, Loader2 } from 'lucide-react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import api from '../api/api';

interface CollectionForm {
  title: string;
  description: string;
  thumbnail: File | null;
  type: 'expert' | 'knowledge' | 'membership' | 'resource';
  expertType: 'Business Excellence' | 'Employee Development' | '';
  submittedBy: string[];
  author: string;
}

interface User {
  _id: string;
  name: string;
}

interface CreateCollectionFormProps {
  setCollections: React.Dispatch<React.SetStateAction<any[]>>;
  setShowCreateCollection: React.Dispatch<React.SetStateAction<boolean>>;
}

const collectionTypes = [
  { value: 'expert', label: 'Expert' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'membership', label: 'Membership' },
  { value: 'resource', label: 'Resource' },
];

const expertTypes = [
  { value: 'Business Excellence', label: 'Business Excellence' },
  { value: 'Employee Development', label: 'Employee Development' },
];

const CreateCollectionForm: React.FC<CreateCollectionFormProps> = ({
  setCollections,
  setShowCreateCollection,
}) => {
  const [collectionForm, setCollectionForm] = useState<CollectionForm>({
    title: '',
    description: '',
    thumbnail: null,
    type: 'knowledge',
    expertType: '',
    submittedBy: [],
    author: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const collectionThumbnailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/getallusers');
        if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
          const usersData = response.data.data.users.map((item: any) => ({
            _id: item.user.userId,
            name: item.user.name,
          }));
          setUsers(usersData);
        } else {
          setUsers([]);
          toast.error('Unexpected user data format', { position: 'top-center' });
        }
      } catch (err) {
        console.error('fetchAllUsers Error:', err);
        toast.error('Failed to fetch users', { position: 'top-center' });
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!collectionForm.title) {
      toast.error('Collection title is required', { position: 'top-center' });
      return;
    }
    if (collectionForm.type === 'expert' && !collectionForm.expertType) {
      toast.error('Expert type is required for expert collections', { position: 'top-center' });
      return;
    }
    if (collectionForm.type === 'membership' && collectionForm.submittedBy.length === 0) {
      toast.error('At least one user must be selected for membership collections', { position: 'top-center' });
      return;
    }
    if (collectionForm.type !== 'resource' && !collectionForm.author) {
      toast.error('Author is required for this collection type', { position: 'top-center' });
      return;
    }
    if (!collectionForm.thumbnail) {
      toast.error('Thumbnail is required. Please upload a thumbnail for the collection.', { position: 'top-center' });
      return;
    }

    const formData = new FormData();
    formData.append('title', collectionForm.title);
    formData.append('description', collectionForm.description || 'No description provided.');
    formData.append('type', collectionForm.type);
    if (collectionForm.type === 'expert') formData.append('expertType', collectionForm.expertType);
    // Thumbnail is now required, so it will always be present after validation
    if (collectionForm.thumbnail) formData.append('thumbnail', collectionForm.thumbnail);
    collectionForm.submittedBy.forEach(userId => formData.append('submittedBy[]', userId));
    formData.append('author', collectionForm.author || '');

    setLoading(true);
    try {
      const response = await api.post('/collections', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201 && response.data.success) {
        const newCollection = response.data.data;
        setCollections(prev => [...prev, newCollection]);

        // Reset form
        setCollectionForm({
          title: '',
          description: '',
          type: 'resource',
          expertType: '',
          thumbnail: null,
          submittedBy: [],
          author: '',
        });

        toast.success(response.data.message || 'Collection created successfully!', {
          position: 'top-center',
          autoClose: 3000,
        });

        setTimeout(() => setShowCreateCollection(false), 500);
      } else {
        throw new Error(response.data.message || 'Failed to create collection');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create collection';
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
      });

      // Reset form on failure
      setCollectionForm({
        title: '',
        description: '',
        type: 'resource',
        expertType: '',
        thumbnail: null,
        submittedBy: [],
        author: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const userOptions = users.map(user => ({ value: user._id, label: user.name }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Collection</h2>
      </div>
      <form onSubmit={handleCreateCollection} className="space-y-6">
        {/* Collection Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Collection Type *</label>
          <Select
            options={collectionTypes}
            value={collectionTypes.find(type => type.value === collectionForm.type)}
            onChange={option =>
              setCollectionForm(prev => ({
                ...prev,
                type: option?.value as any,
                expertType: '',
                submittedBy: option?.value === 'membership' ? prev.submittedBy : [],
              }))
            }
            placeholder="Select Collection Type"
            className="w-full"
            isDisabled={loading}
          />
        </div>

        {/* Expert Type */}
        {collectionForm.type === 'expert' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expert Type *</label>
            <Select
              options={expertTypes}
              value={expertTypes.find(type => type.value === collectionForm.expertType)}
              onChange={option => setCollectionForm(prev => ({ ...prev, expertType: option?.value as any }))}
              placeholder="Select Expert Type"
              className="w-full"
              isDisabled={loading}
            />
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={collectionForm.title}
            onChange={e => setCollectionForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter collection title"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={collectionForm.description}
            onChange={e => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter collection description"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
          />
        </div>

        {/* Submitted By for Membership/Resource */}
        {(collectionForm.type === 'membership' || collectionForm.type === 'resource') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submitted By {collectionForm.type === 'membership' ? '*' : '(Optional)'}
            </label>
            <Select
              isMulti
              options={userOptions}
              value={userOptions.filter(user => collectionForm.submittedBy.includes(user.value))}
              onChange={options =>
                setCollectionForm(prev => ({ ...prev, submittedBy: options.map(option => option.value) }))
              }
              placeholder="Search and select users"
              isSearchable
              className="w-full"
              isDisabled={loading}
            />
          </div>
        )}

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author {collectionForm.type !== 'resource' ? '*' : '(Optional)'}
          </label>
          <input
            type="text"
            value={collectionForm.author}
            onChange={e => setCollectionForm(prev => ({ ...prev, author: e.target.value }))}
            placeholder="Enter author name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail * <span className="text-red-500">(Required)</span>
          </label>
          <div className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            collectionForm.thumbnail 
              ? 'border-green-300 bg-green-50 hover:border-green-400' 
              : 'border-red-300 bg-red-50 hover:border-red-400'
          }`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => {
                const selectedThumbnail = e.target.files?.[0] || null;
                setCollectionForm(prev => ({ ...prev, thumbnail: selectedThumbnail }));
              }}
              className="hidden"
              id="collection-thumbnail-upload"
              ref={collectionThumbnailRef}
              disabled={loading}
              required
            />
            <label htmlFor="collection-thumbnail-upload" className={`cursor-pointer ${loading ? 'pointer-events-none opacity-50' : ''}`}>
              <div className="space-y-2">
                <div className="text-gray-400">
                  <Upload className="w-8 h-8 mx-auto" />
                </div>
                <div className={`text-sm font-medium ${
                  collectionForm.thumbnail 
                    ? 'text-green-700' 
                    : 'text-red-600'
                }`}>
                  {collectionForm.thumbnail 
                    ? `✓ ${collectionForm.thumbnail.name}` 
                    : '⚠ Click to select thumbnail (Required)'}
                </div>
              </div>
            </label>
            {collectionForm.thumbnail && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(collectionForm.thumbnail)}
                  alt="Collection thumbnail preview"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setShowCreateCollection(false)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !collectionForm.thumbnail}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              loading || !collectionForm.thumbnail ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Collection
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCollectionForm;

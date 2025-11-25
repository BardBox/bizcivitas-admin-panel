import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api"; // ✅ Import Axios instance

const EditBlog: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogById = async (blogId: string) => {
      try {
        const response = await api.get(`/blogs/${blogId}`);
        const blog = response.data;

        setTitle(blog.title);
        setAuthor(blog.author);
        setExistingImage(blog.featuredImage ? `${process.env.REACT_APP_BASE_URL}/${blog.featuredImage}` : null);
      } catch (err) {
        console.error("❌ Error fetching blog:", err);
        setError("Failed to load blog data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlogById(id);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    if (featuredImage) formData.append("featuredImage", featuredImage);

    try {
      await api.put(`/blogs/${id}`, formData); // ✅ Send update request
      navigate("/");
    } catch (err) {
      console.error("❌ Error updating blog:", err);
      setError("Failed to update blog.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />

        {/* ✅ Display existing featured image if available */}
        {existingImage && (
          <div className="mb-4">
            <p className="text-gray-500">Current Featured Image:</p>
            <img src={existingImage} alt="Current" className="w-32 h-32 object-cover rounded-md" />
          </div>
        )}

        {/* Upload new image */}
        <input
          type="file"
          onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border rounded-lg"
          accept="image/*"
        />

        <button
          type="submit"
          className={`bg-blue-500 text-white px-4 py-2 rounded-lg ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
};

export default EditBlog;

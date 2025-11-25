import React from "react";
import { Link } from "react-router-dom";
import api from "../api/api"; // Import the Axios instance

// Define the Blog interface directly in this file
interface Blog {
  _id: string;
  title: string;
  author: string;
  featuredImage: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogCardProps {
  blog: Blog;
  onDelete: (id: string) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, onDelete }) => {
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/blogs/${id}`);
      onDelete(id); // Update UI after successful deletion
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <img
        src={`${import.meta.env.VITE_API_BASE_URL}/${blog.featuredImage}`}
        alt={blog.title}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h2 className="text-xl font-bold mb-2">{blog.title}</h2>
      <p className="text-gray-600 mb-4">By {blog.author}</p>
      <div className="flex space-x-4">
        <Link
          to={`/view-blog/${blog._id}`}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          View
        </Link>
        <Link
          to={`/edit-blog/${blog._id}`}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
        >
          Edit
        </Link>
        <button
          onClick={() => handleDelete(blog._id)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default BlogCard;

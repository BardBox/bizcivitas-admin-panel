import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";

const ViewBlog: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogById = async (blogId: string) => {
      try {
        const response = await api.get(`/blogs/${blogId}`);
        setBlog(response.data.data);
      } catch (err) {
        console.error("❌ Error fetching blog:", err);
        setError("Failed to load blog. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlogById(id);
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!blog) return <div>No blog found</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
      <p className="text-gray-600 mb-4">By <span className="font-semibold">{blog.author}</span></p>

      {/* Featured Image */}
      {blog.featuredImage && (
        <img
          src={`${process.env.REACT_APP_BASE_URL}/${blog.featuredImage}`}
          alt={blog.title}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}

      {/* Blog Content */}
      <div className="space-y-6">
        {blog.sections.map((section: any, secIndex: number) => (
          <div key={secIndex}>
            <h2 className="text-2xl font-semibold mb-2">{section.heading}</h2>
            <p className="text-gray-700">{section.content}</p>

            {/* Subsections */}
            {section.subsections && section.subsections.length > 0 && (
              <div className="mt-4 pl-4 border-l-4 border-gray-300">
                {section.subsections.map((sub: any, subIndex: number) => (
                  <div key={subIndex} className="mb-4">
                    <h3 className="text-xl font-medium">{sub.heading}</h3>
                    <p className="text-gray-600">{sub.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewBlog;

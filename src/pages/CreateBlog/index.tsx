import React, { useState } from "react";
import api from "../../api/api"; // ✅ Import the Axios instance
import { useNavigate } from "react-router-dom";

// Define TypeScript interfaces for expected blog structure
interface Subsection {
  heading: string;
  content: string;
}

interface Section {
  heading: string;
  content: string;
  subsections: Subsection[];
}

const CreateBlog: React.FC = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [sections, setSections] = useState<Section[]>([{ heading: "", content: "", subsections: [] }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle Blog Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    if (featuredImage) formData.append("featuredImage", featuredImage);
    formData.append("sections", JSON.stringify(sections));

    try {
      const response = await api.post("/blogs/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Blog Created Successfully:", response.data);
      navigate("/blogs"); // ✅ Redirect to blogs list after creation
    } catch (error) {
      console.error("❌ Error creating blog:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Section Updates
  const updateSection = (index: number, key: keyof Section, value: string) => {
    const updatedSections = [...sections];
  
    if (typeof updatedSections[index][key] === "string") {
      updatedSections[index][key] = value as any; // Type assertion (not ideal)
    } else {
      console.error(`Invalid assignment: ${key} is not a string property.`);
    }
  
    setSections(updatedSections);
  };
  

  // ✅ Handle Subsection Updates
  const updateSubsection = (sectionIndex: number, subIndex: number, key: keyof Subsection, value: string) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].subsections[subIndex][key] = value;
    setSections(updatedSections);
  };

  // ✅ Add New Section
  const addSection = () => {
    setSections([...sections, { heading: "", content: "", subsections: [] }]);
  };

  // ✅ Add New Subsection to a Section
  const addSubsection = (index: number) => {
    const updatedSections = [...sections];
    updatedSections[index].subsections.push({ heading: "", content: "" });
    setSections(updatedSections);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ✅ Blog Title */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />

        {/* ✅ Author Name */}
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />

        {/* ✅ Featured Image Upload */}
        <input
          type="file"
          onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border rounded-lg"
          accept="image/*"
        />

        {/* ✅ Sections */}
        <h2 className="text-lg font-semibold">Sections</h2>
        {sections.map((section, secIndex) => (
          <div key={secIndex} className="border p-4 rounded-lg space-y-2">
            <input
              type="text"
              placeholder="Section Heading"
              value={section.heading}
              onChange={(e) => updateSection(secIndex, "heading", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <textarea
              placeholder="Section Content"
              value={section.content}
              onChange={(e) => updateSection(secIndex, "content", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={() => addSubsection(secIndex)}
              className="bg-gray-300 px-4 py-2 rounded-lg"
            >
              ➕ Add Subsection
            </button>

            {/* ✅ Subsections */}
            {section.subsections.map((sub, subIndex) => (
              <div key={subIndex} className="ml-4 mt-2 p-3 border rounded-lg">
                <input
                  type="text"
                  placeholder="Subsection Heading"
                  value={sub.heading}
                  onChange={(e) => updateSubsection(secIndex, subIndex, "heading", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <textarea
                  placeholder="Subsection Content"
                  value={sub.content}
                  onChange={(e) => updateSubsection(secIndex, subIndex, "content", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>
        ))}

        <button
          type="button"
          onClick={addSection}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg"
        >
          ➕ Add Section
        </button>

        {/* ✅ Submit Button */}
        <button
          type="submit"
          className={`bg-blue-500 text-white px-4 py-2 rounded-lg ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Blog"}
        </button>
      </form>
    </div>
  );
};

export default CreateBlog;

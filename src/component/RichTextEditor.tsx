import React, { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Extension } from "@tiptap/core";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiLink,
  FiType,
  FiChevronDown,
} from "react-icons/fi";
import { MdFormatListNumbered } from "react-icons/md";

// Custom FontSize extension
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

// Custom LineHeight extension
const LineHeight = Extension.create({
  name: "lineHeight",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) =>
              element.style.lineHeight?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          return this.options.types.every((type: string) =>
            commands.updateAttributes(type, { lineHeight })
          );
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return this.options.types.every((type: string) =>
            commands.resetAttributes(type, "lineHeight")
          );
        },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
}) => {
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showLineHeightDropdown, setShowLineHeightDropdown] = useState(false);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const lineHeightDropdownRef = useRef<HTMLDivElement>(null);

  const fontSizes = [
    { label: "Small", value: "12px" },
    { label: "Normal", value: "14px" },
    { label: "Medium", value: "16px" },
    { label: "Large", value: "18px" },
    { label: "Extra Large", value: "24px" },
    { label: "Huge", value: "32px" },
  ];

  const lineHeights = [
    { label: "Single", value: "1" },
    { label: "1.15", value: "1.15" },
    { label: "1.5", value: "1.5" },
    { label: "Double", value: "2" },
    { label: "2.5", value: "2.5" },
    { label: "3.0", value: "3" },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fontSizeDropdownRef.current &&
        !fontSizeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFontSizeDropdown(false);
      }
      if (
        lineHeightDropdownRef.current &&
        !lineHeightDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLineHeightDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      LineHeight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "bullet-list",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "ordered-list",
        },
      }),
      ListItem,
      Bold,
      Italic,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-3",
      },
    },
  });

  const addLink = () => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive("bold")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Bold"
          >
            <FiBold size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive("italic")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Italic"
          >
            <FiItalic size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive("underline")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Underline"
          >
            <FiUnderline size={16} />
          </button>
        </div>

        {/* Font Size */}
        <div
          ref={fontSizeDropdownRef}
          className="relative border-r border-gray-300 pr-2 mr-2"
        >
          <button
            type="button"
            onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
            title="Font Size"
          >
            <span className="text-sm">Size</span>
            <FiChevronDown size={12} />
          </button>
          {showFontSizeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setFontSize(size.value).run();
                    setShowFontSizeDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  style={{ fontSize: size.value }}
                >
                  {size.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetFontSize().run();
                  setShowFontSizeDropdown(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-t border-gray-200"
              >
                Reset Size
              </button>
            </div>
          )}
        </div>

        {/* Line Height */}
        <div
          ref={lineHeightDropdownRef}
          className="relative border-r border-gray-300 pr-2 mr-2"
        >
          <button
            type="button"
            onClick={() => setShowLineHeightDropdown(!showLineHeightDropdown)}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
            title="Line Height"
          >
            <span className="text-sm">Spacing</span>
            <FiChevronDown size={12} />
          </button>
          {showLineHeightDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
              {lineHeights.map((height) => (
                <button
                  key={height.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setLineHeight(height.value).run();
                    setShowLineHeightDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  style={{ lineHeight: height.value }}
                >
                  {height.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLineHeight().run();
                  setShowLineHeightDropdown(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-t border-gray-200"
              >
                Reset Spacing
              </button>
            </div>
          )}
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive("bulletList")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Bullet List"
          >
            <FiList size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive("orderedList")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Numbered List"
          >
            <MdFormatListNumbered size={16} />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: "left" })
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Align Left"
          >
            <FiAlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: "center" })
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Align Center"
          >
            <FiAlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: "right" })
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Align Right"
          >
            <FiAlignRight size={16} />
          </button>
        </div>

        {/* Heading and Link */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive("heading", { level: 2 })
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Heading"
          >
            <FiType size={16} />
          </button>
          <button
            type="button"
            onClick={addLink}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive("link")
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Add Link"
          >
            <FiLink size={16} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="rich-text-editor-content">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>

      {/* CSS styles using a style tag without jsx */}
      <style>{`
        .rich-text-editor-content {
          min-height: 120px;
        }

        .rich-text-editor-content .ProseMirror {
          outline: none;
          padding: 12px;
          min-height: 120px;
        }

        .rich-text-editor-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }

        .rich-text-editor-content .bullet-list {
          list-style-type: disc;
          margin-left: 1rem;
          padding-left: 1rem;
        }

        .rich-text-editor-content .ordered-list {
          list-style-type: decimal;
          margin-left: 1rem;
          padding-left: 1rem;
        }

        .rich-text-editor-content li {
          margin: 0.25rem 0;
        }

        .rich-text-editor-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }

        .rich-text-editor-content p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .rich-text-editor-content strong {
          font-weight: 600;
        }

        .rich-text-editor-content em {
          font-style: italic;
        }

        .rich-text-editor-content u {
          text-decoration: underline;
        }

        .rich-text-editor-content a {
          color: #2563eb;
          text-decoration: underline;
        }

        .rich-text-editor-content a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

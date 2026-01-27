import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "./editor.css";
import { CiSaveDown2, CiShare1 } from "react-icons/ci";

export const Editor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your document...",
      }),
    ],
    content: "",
  });

  if (!editor) {
    return null;
  }

  const getContent = () => {
    console.log(editor.getHTML());
    alert("Saved (fake for now)");
  };

  return (
    <div className="editor-page">
      {/* HEADER */}
      <div className="editor-header">
        <input className="editor-title" defaultValue="Untitled Document" />

        <div className="editor-actions">
          <button className="btn-secondary">
            <CiShare1 />
            Share
          </button>
          <button className="btn-primary" onClick={getContent}>
            <CiSaveDown2 />
            Save
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "active" : ""}
        >
          Bold
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "active" : ""}
        >
          Italic
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>

        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
          List
        </button>
          <button onClick={() => editor.chain().focus().undo().run()}>Undo</button>
          <button onClick={() => editor.chain().focus().redo().run()}>Redo</button>

      </div>

      {/* EDITOR */}
      <div className="editor-container">
        <EditorContent editor={editor}  />
      </div>
    </div>
  );
};

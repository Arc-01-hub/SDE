import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "./editor.css";
import { CiSaveDown2, CiShare1 } from "react-icons/ci";
import { HiArrowLeft } from "react-icons/hi";
import { MdAdd, MdClose } from "react-icons/md";
import { LuHeading2, LuHeading1 } from "react-icons/lu";
import { MdFormatQuote, MdCode } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "../api/api";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";
const CONTENT_UPDATE_DELAY = 500;
const TYPING_INDICATOR_TIMEOUT = 3000;

// Debug: Check socket URL
console.log("🔌 Socket server URL:", SOCKET_URL);

export const Editor = () => {
  const project = useLocation().state?.project;
  const nav = useNavigate();

  // State Management
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [newTag, setNewTag] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [typingUsers, setTypingUsers] = useState({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeChat, setActiveChat] = useState(null); // userId of collaborator to chat with
  const [remoteCursors, setRemoteCursors] = useState({}); // Track remote user cursor positions
  const [unreadMessages, setUnreadMessages] = useState({}); // Track unread message count by user

  // Refs
  const socketRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const typingTimersRef = useRef({});
  const isUpdatingFromRemoteRef = useRef(false);
  const lastContentRef = useRef("");
  const userIdRef = useRef(localStorage.getItem("userId"));
  const usernameRef = useRef(localStorage.getItem("userName")); // ← Fixed: userName (capital N)
  const projectIdRef = useRef(project?._id);

  console.log("📋 LocalStorage Check:");
  console.log("   userId:", userIdRef.current);
  console.log("   username:", usernameRef.current);
  const contentOwnershipRef = useRef({}); // Track which user owns which content segments

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing... (Changes sync in real-time)",
      }),
    ],
    content: "",
    onUpdate: () => {
      // Handled in separate effect
    },
  });

  const isMeOwner = useCallback(() => {
    return project?.owner?._id === userIdRef.current;
  }, [project]);

  // ===== SOCKET INITIALIZATION =====
  useEffect(() => {
    if (socketRef.current) {
      console.log("🔄 Socket already exists, skipping initialization");
      return;
    }

    console.log("🚀 Initializing Socket.IO connection to:", SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
      auth: {
        projectId: projectIdRef.current || "",
        userId: userIdRef.current || "",
        username: usernameRef.current || "",
      },
    });

    socketRef.current.on("connect", () => {
      console.log(
        "✅ Socket CONNECTED successfully! ID:",
        socketRef.current.id,
      );
      setIsSocketConnected(true);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("❌ Socket DISCONNECTED. Reason:", reason);
      setIsSocketConnected(false);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("🔴 Connection ERROR:", error.message || error);
      console.error("   Error details:", error);
      setIsSocketConnected(false);
    });

    socketRef.current.on("error", (error) => {
      console.error("⚠️ Socket error event:", error);
    });

    return () => {
      // Don't disconnect on unmount of this effect
    };
  }, []);

  // ===== JOIN PROJECT ROOM =====
  useEffect(() => {
    if (!socketRef.current || !isSocketConnected) {
      console.log("⏳ Waiting for socket connection...");
      return;
    }

    if (!project) {
      console.error("❌ ERROR: Project is undefined! Cannot join room.");
      console.error("   Make sure you navigate to editor with project data.");
      return;
    }

    if (!project._id) {
      console.error("❌ ERROR: Project ID is missing!");
      console.error("   Project object:", project);
      return;
    }

    const projectId = project._id;
    projectIdRef.current = projectId;

    console.log("🏃 Joining project room:", projectId);

    socketRef.current.emit("join-project", projectId, (response) => {
      if (response?.status === "success") {
        console.log("✅ Successfully joined project room!");
      } else {
        console.error("❌ Failed to join project room:", response?.message);
      }
    });
  }, [isSocketConnected, project]);

  // ===== LOAD PROJECT DATA =====
  useEffect(() => {
    if (!project || !editor) {
      console.log("⏳ Waiting for project and editor...");
      return;
    }

    if (!project._id) {
      console.error("❌ Project object has no _id:", project);
      return;
    }

    console.log("📥 Loading project data for:", project._id);

    // Set title
    if (project.title) {
      setTitle(project.title);
    }

    // Set tags
    if (project.tags && Array.isArray(project.tags)) {
      setTags(project.tags);
    }

    // Load all collaborators from project (fixed list from owner)
    if (project.collaborators && Array.isArray(project.collaborators)) {
      const fixedCollabs = project.collaborators
        .filter((c) => (c._id || c.userId) !== userIdRef.current)
        .map((c) => ({
          username: c.username || c.name,
          userId: c._id || c.userId,
          online: false, // Initially offline until socket confirms
        }));
      setCollaborators(fixedCollabs);
      console.log(`👥 Loaded ${fixedCollabs.length} collaborators from project`);
    }

    // Set content
    if (project.content) {
      isUpdatingFromRemoteRef.current = true;
      lastContentRef.current = project.content;
      editor.commands.setContent(project.content);
      setTimeout(() => {
        isUpdatingFromRemoteRef.current = false;
      }, 100);
    }

    // Set last saved time
    if (project.lastSaved) {
      setLastSaved(new Date(project.lastSaved));
    }
  }, [project, editor]);

  // ===== SETUP SOCKET LISTENERS =====
  useEffect(() => {
    if (!socketRef.current || !editor) return;

    const socket = socketRef.current;
    const userId = userIdRef.current;

    // Handle content updates from other users
    const handleContentUpdate = (data) => {
      if (!data.content) return;

      console.log("📝 Content update from other user:", data.username);

      isUpdatingFromRemoteRef.current = true;
      lastContentRef.current = data.content;

      // Track content ownership for remote updates
      if (data.userId && data.username) {
        contentOwnershipRef.current[data.userId] = {
          username: data.username,
          lastContent: data.content,
        };
      }

      const currentContent = editor.getHTML();
      if (currentContent !== data.content) {
        // Store cursor position
        const { from } = editor.state.selection;

        editor.commands.setContent(data.content, false);

        // Restore cursor position (approximately)
        try {
          editor.setSelection(from);
        } catch (e) {
          // Cursor position may not be valid anymore
        }
      }

      setTimeout(() => {
        isUpdatingFromRemoteRef.current = false;
      }, 50);
    };

    // Handle typing indicators
    const handleUserTyping = (data) => {
      if (data.userId === userId) return;

      console.log("⌨️ User typing:", data.username);

      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: {
          username: data.username,
          timestamp: Date.now(),
        },
      }));

      // Clear existing timer
      if (typingTimersRef.current[data.userId]) {
        clearTimeout(typingTimersRef.current[data.userId]);
      }

      // Auto-clear after timeout
      typingTimersRef.current[data.userId] = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
        delete typingTimersRef.current[data.userId];
      }, TYPING_INDICATOR_TIMEOUT);
    };

    // Handle online users list
    const handleOnlineUsers = (users) => {
      const filteredCollabs = users
        .filter((u) => u.userId !== userId)
        .map((u) => ({
          username: u.username,
          userId: u.userId,
          online: true,
        }));

      setCollaborators(filteredCollabs);
      console.log(`👥 Online collaborators: ${filteredCollabs.length}`);
    };

    // Handle online collaborators update - update status only for existing collaborators
    const handleAllCollaborators = (users) => {
      setCollaborators((prevCollabs) =>
        prevCollabs.map((collab) => {
          const onlineUser = users.find((u) => u.userId === collab.userId);
          return {
            ...collab,
            online: !!onlineUser,
          };
        })
      );
      const onlineCount = users.filter((u) => u.userId !== userId).length;
      console.log(`👥 Collaborators update: ${onlineCount} online`);
    };

    // Handle title changes from other users
    const handleTitleChange = (data) => {
      if (data.userId !== userId) {
        console.log("📝 Title changed by:", data.username);
        setTitle(data.title);
      }
    };

    // Handle tag changes from other users
    const handleTagChange = (data) => {
      if (data.userId !== userId) {
        console.log("🏷️ Tags changed by:", data.username);
        setTags(data.tags);
      }
    };

    // Handle user disconnect
    const handleUserDisconnect = (data) => {
      console.log("❌ User disconnected:", data.username);
      // Remove from typing users
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[data.userId];
        return updated;
      });
      // Update collaborators status
      setCollaborators((prev) =>
        prev.map((collab) =>
          collab.userId === data.userId ? { ...collab, online: false } : collab
        )
      );
    };

    socket.on("receive-content", handleContentUpdate);
    socket.on("user-typing", handleUserTyping);
    socket.on("online-users", handleOnlineUsers);
    socket.on("all-collaborators", handleAllCollaborators);
    socket.on("title-change", handleTitleChange);
    socket.on("tag-change", handleTagChange);
    socket.on("user-disconnect", handleUserDisconnect);

    // Handle chat messages
    const handleChatMessage = (data) => {
      console.log("💬 Chat message from:", data.username);
      setMessages((prev) => [...prev, {
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: new Date(data.timestamp),
      }]);
      
      // Track unread if not in active chat
      if (data.userId !== activeChat && data.userId !== userIdRef.current) {
        setUnreadMessages((prev) => ({
          ...prev,
          [data.userId]: (prev[data.userId] || 0) + 1,
        }));
      }
    };

    // Handle cursor position from remote users
    const handleCursorPosition = (data) => {
      if (data.userId === userId) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [data.userId]: {
          username: data.username,
          line: data.line,
          position: data.position,
        },
      }));
    };

    socket.on("chat-message", handleChatMessage);
    socket.on("cursor-position", handleCursorPosition);

    return () => {
      socket.off("receive-content", handleContentUpdate);
      socket.off("user-typing", handleUserTyping);
      socket.off("online-users", handleOnlineUsers);
      socket.off("all-collaborators", handleAllCollaborators);
      socket.off("title-change", handleTitleChange);
      socket.off("tag-change", handleTagChange);
      socket.off("user-disconnect", handleUserDisconnect);
      socket.off("chat-message", handleChatMessage);
      socket.off("cursor-position", handleCursorPosition);
    };
  }, [editor]);

  // ===== HANDLE EDITOR UPDATES =====
  useEffect(() => {
    if (!editor || !project || !socketRef.current) return;

    const socket = socketRef.current;
    const userId = userIdRef.current;
    const username = usernameRef.current;
    const projectId = project._id;

    const handleUpdate = () => {
      // Ignore if this is a remote update
      if (isUpdatingFromRemoteRef.current) return;

      // Update statistics
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;

      setWordCount(words);
      setCharCount(chars);

      // Emit typing indicator immediately
      if (socket.connected) {
        socket.emit("user-typing", {
          projectId,
          userId,
          username,
        });
      }

      // Debounce content update
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const content = editor.getHTML();

        // Only send if content actually changed
        if (content !== lastContentRef.current && socket.connected) {
          lastContentRef.current = content;

          console.log("📤 Sending content update, length:", content.length);

          socket.emit(
            "update-content",
            { projectId, content, userId, username },
            (response) => {
              if (response?.status === "error") {
                console.error("❌ Content update failed:", response.message);
              }
            },
          );
        }
      }, CONTENT_UPDATE_DELAY);
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [editor, project]);

  // ===== SAVE PROJECT =====
  const updateProject = useCallback(async () => {
    if (!project?._id) {
      alert("Project not found");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const content = editor.getHTML();
      lastContentRef.current = content;

      const response = await api.put(`/project/update/${project._id}`, {
        title,
        content,
        tags,
        lastSaved: new Date().toISOString(),
      });

      setSaveStatus("success");
      setLastSaved(new Date());

      console.log("✅ Project saved successfully");

      setTimeout(() => {
        nav("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("❌ Save failed:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [project, editor, title, tags, nav]);

  // ===== TAG MANAGEMENT =====
  const addTag = useCallback(() => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const updatedTags = [...tags, trimmedTag];
      setTags(updatedTags);
      setNewTag("");

      // Emit tag change via socket
      if (socketRef.current?.connected && project?._id) {
        socketRef.current.emit("tag-change", {
          projectId: project._id,
          tags: updatedTags,
          userId: userIdRef.current,
          username: usernameRef.current,
        });
      }
    }
  }, [newTag, tags, project]);

  const removeTag = useCallback(
    (tagToRemove) => {
      const updatedTags = tags.filter((tag) => tag !== tagToRemove);
      setTags(updatedTags);

      // Emit tag change via socket
      if (socketRef.current?.connected && project?._id) {
        socketRef.current.emit("tag-change", {
          projectId: project._id,
          tags: updatedTags,
          userId: userIdRef.current,
          username: usernameRef.current,
        });
      }
    },
    [tags, project],
  );

  // ===== CHAT MANAGEMENT =====
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socketRef.current || !activeChat) return;

    const timestamp = new Date();
    const message = {
      projectId: projectIdRef.current,
      userId: userIdRef.current,
      username: usernameRef.current,
      recipientId: activeChat,
      message: newMessage.trim(),
      timestamp: timestamp.toISOString(),
    };

    socketRef.current.emit("send-message", message);
    
    // Add to local messages
    setMessages((prev) => [...prev, {
      userId: userIdRef.current,
      username: "You",
      message: newMessage.trim(),
      timestamp: timestamp,
    }]);

    console.log("💬 Message sent to:", activeChat);
    setNewMessage("");
  }, [newMessage, activeChat]);

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    return () => {
      // Clear timers
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      Object.values(typingTimersRef.current).forEach(clearTimeout);

      // Leave room and disconnect
      if (socketRef.current && projectIdRef.current) {
        socketRef.current.emit("leave-project", projectIdRef.current);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  if (!editor) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
        }}
      >
        <div>Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      {/* PROJECT ERROR BANNER */}
      {!project && (
        <div
          style={{
            background: "#dc2626",
            color: "white",
            padding: "12px 20px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span>❌</span>
          <span>
            Error: No project loaded! Please go back and open a project from
            your dashboard.
          </span>
          <button
            onClick={() => nav("/dashboard")}
            style={{
              marginLeft: "12px",
              padding: "4px 12px",
              background: "white",
              color: "#dc2626",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* CONNECTION STATUS BANNER */}
      {project && !isSocketConnected && (
        <div
          style={{
            background: "#ef4444",
            color: "white",
            padding: "12px 20px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span>🔴</span>
          <span>Offline - Trying to connect to collaboration server...</span>
          <span>
            Make sure your backend socket server is running on localhost:5000
          </span>
        </div>
      )}

      {/* TYPING INDICATOR BANNER */}
      {Object.keys(typingUsers).length > 0 && (
        <div
          style={{
            background: "#3b82f6",
            color: "white",
            padding: "10px 20px",
            textAlign: "center",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            borderBottom: "2px solid #1d4ed8",
          }}
        >
          <span>✏️</span>
          <span>
            {Object.values(typingUsers)
              .map((u) => u.username)
              .join(", ")}
          </span>
          <span style={{ marginLeft: "4px" }}>
            {Object.keys(typingUsers).length === 1 ? "is" : "are"} typing...
          </span>
        </div>
      )}

      {/* HEADER */}
      <div className="editor-header">
        <button className="btn-back" onClick={() => nav(-1)} title="Go back">
          <HiArrowLeft />
        </button>

        <div className="editor-title-section">
          <input
            className="editor-title"
            placeholder="Untitled Document"
            value={title}
            disabled={!isMeOwner()}
            onChange={(e) => {
              setTitle(e.target.value);
              // Emit title change via socket
              if (socketRef.current?.connected && project?._id) {
                socketRef.current.emit("title-change", {
                  projectId: project._id,
                  title: e.target.value,
                  userId: userIdRef.current,
                  username: usernameRef.current,
                });
              }
            }}
          />
          {!isSocketConnected && (
            <div
              style={{
                fontSize: "12px",
                color: "#ef4444",
                marginTop: "4px",
              }}
            >
              ⚠️ Offline - changes will not sync
            </div>
          )}
        </div>

        <div className="editor-actions">
          <button className="btn-secondary" title="Share document">
            <CiShare1 />
            Share
          </button>
          <button
            className="btn-primary"
            onClick={updateProject}
            disabled={isSaving || !isMeOwner()}
            title={
              !isMeOwner()
                ? "Only project owner can save"
                : isSaving
                  ? "Saving..."
                  : "Save document"
            }
          >
            <CiSaveDown2 />
            {isSaving ? "Saving..." : "Save"}
          </button>
          {saveStatus === "success" && (
            <span className="save-status success">✓ Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="save-status error">✗ Error</span>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "active" : ""}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "active" : ""}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "active" : ""}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={editor.isActive("heading", { level: 1 }) ? "active" : ""}
            title="Heading 1"
          >
            <LuHeading1 />
          </button>

          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
            title="Heading 2"
          >
            <LuHeading2 />
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "active" : ""}
            title="Bullet List"
          >
            •
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "active" : ""}
            title="Ordered List"
          >
            1.
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "active" : ""}
            title="Code Block"
          >
            <MdCode />
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "active" : ""}
            title="Quote"
          >
            <MdFormatQuote />
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            ↷
          </button>
        </div>
      </div>

      {/* MAIN EDITOR LAYOUT */}
      <div className="editor-layout" style={{ opacity: project ? 1 : 0.5 }}>
        {/* EDITOR */}
        <div
          className="editor-container"
          style={{ pointerEvents: project ? "auto" : "none" }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="editor-sidebar">
          {/* DOCUMENT INFO */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Document Info</h3>
            <div className="info-item">
              <span className="info-label">Words:</span>
              <span className="info-value">{wordCount}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Characters:</span>
              <span className="info-value">{charCount}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Saved:</span>
              <span className="info-value">
                {lastSaved.toLocaleTimeString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span
                className="info-value"
                style={{
                  color: isSocketConnected ? "#22c55e" : "#ef4444",
                }}
              >
                {isSocketConnected ? "🟢 Connected" : "🔴 Offline"}
              </span>
            </div>
          </div>

          {/* TAGS */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Tags</h3>
            <div className="tags-container">
              {tags.map((tag, idx) => (
                <div key={idx} className="tag-item">
                  <span>{tag}</span>
                  <button
                    className="tag-remove"
                    onClick={() => removeTag(tag)}
                    title="Remove tag"
                  >
                    <MdClose />
                  </button>
                </div>
              ))}
            </div>
            <div className="tag-input-group">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                className="tag-input"
              />
              <button className="btn-add-tag" onClick={addTag} title="Add tag">
                <MdAdd />
              </button>
            </div>
          </div>

          {/* COLLABORATORS */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              Collaborators ({collaborators.length})
            </h3>

            <div className="collaborators-container">
              {/* ONLINE COLLABORATORS */}
              {collaborators.filter((c) => c.online).length > 0 && (
                <div className="collaborator-group">
                  <div className="collaborator-group-title">🟢 Online</div>
                  {collaborators
                    .filter((c) => c.online)
                    .map((collab, idx) => {
                      const isTyping = typingUsers[collab.userId];
                      return (
                        <div key={idx} className="collaborator-item">
                          <div
                            className={`collab-avatar online`}
                            title={collab.username}
                          >
                            {collab.username?.[0]?.toUpperCase() || "?"}
                          </div>

                          <div className="collab-info">
                            <div className="collab-username">
                              {collab.username}
                            </div>

                            <div
                              className={`collab-status ${
                                isTyping ? "typing" : "online"
                              }`}
                            >
                              <span className="status-dot" />
                              {isTyping ? (
                                <>
                                  <span style={{ fontWeight: "600" }}>
                                    typing
                                  </span>
                                  <span
                                    className="typing-indicator"
                                    style={{ marginLeft: "4px" }}
                                  >
                                    <span>.</span>
                                    <span>.</span>
                                    <span>.</span>
                                  </span>
                                </>
                              ) : (
                                "Online"
                              )}
                            </div>
                          </div>

                          <button
                            className="btn-chat"
                            onClick={() => {
                              setActiveChat(collab.userId);
                              setUnreadMessages((prev) => ({
                                ...prev,
                                [collab.userId]: 0,
                              }));
                            }}
                            title="Chat"
                          >
                            💬
                            {unreadMessages[collab.userId] > 0 && (
                              <span className="notification-badge">
                                {unreadMessages[collab.userId]}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* OFFLINE COLLABORATORS */}
              {collaborators.filter((c) => !c.online).length > 0 && (
                <div className="collaborator-group">
                  <div className="collaborator-group-title">🔴 Offline</div>
                  {collaborators
                    .filter((c) => !c.online)
                    .map((collab, idx) => (
                      <div key={idx} className="collaborator-item">
                        <div
                          className={`collab-avatar offline`}
                          title={collab.username}
                        >
                          {collab.username?.[0]?.toUpperCase() || "?"}
                        </div>

                        <div className="collab-info">
                          <div className="collab-username">
                            {collab.username}
                          </div>

                          <div className="collab-status offline">
                            <span className="status-dot" />
                            Offline
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* CHAT MODAL */}
          {activeChat && (
            <div className="chat-modal">
              <div className="chat-modal-header">
                <div className="chat-modal-title">
                  {collaborators.find((c) => c.userId === activeChat)?.username || "Chat"}
                </div>
                <button
                  className="chat-modal-close"
                  onClick={() => setActiveChat(null)}
                  title="Close chat"
                >
                  ✕
                </button>
              </div>

              <div className="messages-container">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${
                      msg.userId === userIdRef.current ? "sent" : "received"
                    }`}
                  >
                    <div className="message-username">{msg.username}</div>
                    <div className="message-content">{msg.message}</div>
                    <div className="message-time">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="message-input-group">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="message-input"
                  autoFocus
                />
                <button
                  className="btn-send"
                  onClick={sendMessage}
                  title="Send message"
                >
                  ➤
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

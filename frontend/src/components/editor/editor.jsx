import {useEditor, EditorContent} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "./editor.css";
import {CiSaveDown2, CiShare1} from "react-icons/ci";
import {HiArrowLeft} from "react-icons/hi";
import {MdAdd, MdClose} from "react-icons/md";
import {LuHeading2, LuHeading1} from "react-icons/lu";
import {MdFormatQuote, MdCode} from "react-icons/md";
import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useState, useRef, useCallback} from "react";
import api from "../api/api";
import {io} from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";
const CONTENT_UPDATE_DELAY = 500;
const TYPING_INDICATOR_TIMEOUT = 3000;

const AI_ACTIONS = [
    { key: "improve",   label: "✨ Improve Writing",  desc: "Make it clearer & professional" },
    { key: "grammar",   label: "🔧 Fix Grammar",       desc: "Fix errors & punctuation" },
    { key: "shorter",   label: "✂️ Make Shorter",      desc: "Concise version" },
    { key: "longer",    label: "📝 Make Longer",       desc: "Add more details" },
    { key: "summarize", label: "📋 Summarize",         desc: "2-3 sentence summary" },
    { key: "translate", label: "🌍 Translate",         desc: "Switch language" },
];

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
    const [activeChat, setActiveChat] = useState(null);
    const [remoteCursors, setRemoteCursors] = useState({});
    const [unreadMessages, setUnreadMessages] = useState({});

    // AI State
    const [aiPopupOpen, setAiPopupOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState("");
    const [aiAction, setAiAction] = useState("");
    const [aiSelectedText, setAiSelectedText] = useState("");
    const aiPopupRef = useRef(null);

    // Refs
    const socketRef = useRef(null);
    const debounceTimerRef = useRef(null);
    const typingTimersRef = useRef({});
    const isUpdatingFromRemoteRef = useRef(false);
    const lastContentRef = useRef("");
    const userIdRef = useRef(localStorage.getItem("userId"));
    const usernameRef = useRef(localStorage.getItem("userName"));
    const projectIdRef = useRef(project?._id);
    const contentOwnershipRef = useRef({});

    // Initialize editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "Start typing... (Changes sync in real-time)",
            }),
        ],
        content: "",
        onUpdate: () => {},
    });

    const isMeOwner = useCallback(() => {
        return project?.owner?._id === userIdRef.current;
    }, [project]);

    // ===== AI WRITING ASSISTANT =====
    const handleAiAssist = useCallback(async (action) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const selectedText = from !== to
            ? editor.state.doc.textBetween(from, to, " ")
            : editor.getText();

        if (!selectedText.trim()) {
            alert("Please select some text or write something first!");
            return;
        }

        setAiAction(action);
        setAiSelectedText(selectedText);
        setAiLoading(true);
        setAiResult("");
        setAiPopupOpen(true);

        try {
            const resp = await api.post("/ai/assist", { text: selectedText, action });
            setAiResult(resp.data.result);
        } catch (err) {
            setAiResult("❌ Error: " + (err?.response?.data?.message || "Failed to get AI response"));
        } finally {
            setAiLoading(false);
        }
    }, [editor]);

    const handleApplyAiResult = useCallback(() => {
        if (!editor || !aiResult) return;
        const { from, to } = editor.state.selection;
        if (from !== to) {
            editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, aiResult).run();
        } else {
            editor.commands.setContent(aiResult);
        }
        setAiPopupOpen(false);
        setAiResult("");
    }, [editor, aiResult]);

    // Close AI popup on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (aiPopupRef.current && !aiPopupRef.current.contains(e.target)) {
                setAiPopupOpen(false);
            }
        };
        if (aiPopupOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [aiPopupOpen]);

    // ===== SOCKET INITIALIZATION =====
    useEffect(() => {
        if (socketRef.current) return;

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
            setIsSocketConnected(true);
        });

        socketRef.current.on("disconnect", () => {
            setIsSocketConnected(false);
        });

        socketRef.current.on("connect_error", () => {
            setIsSocketConnected(false);
        });

        return () => {};
    }, []);

    // ===== JOIN PROJECT ROOM =====
    useEffect(() => {
        if (!socketRef.current || !isSocketConnected || !project?._id) return;

        const projectId = project._id;
        projectIdRef.current = projectId;

        socketRef.current.emit("join-project", projectId, (response) => {});
    }, [isSocketConnected, project]);

    // ===== LOAD PROJECT DATA =====
    useEffect(() => {
        if (!project || !editor) return;

        if (project.title) setTitle(project.title);
        if (project.tags && Array.isArray(project.tags)) setTags(project.tags);

        if (project.collaborators && Array.isArray(project.collaborators)) {
            const fixedCollabs = project.collaborators
                .filter((c) => (c._id || c.userId) !== userIdRef.current)
                .map((c) => ({
                    username: c.username || c.name,
                    userId: c._id || c.userId,
                    online: false,
                }));
            setCollaborators(fixedCollabs);
        }

        if (project.content) {
            isUpdatingFromRemoteRef.current = true;
            lastContentRef.current = project.content;
            editor.commands.setContent(project.content);
            setTimeout(() => { isUpdatingFromRemoteRef.current = false; }, 100);
        }

        if (project.lastSaved) setLastSaved(new Date(project.lastSaved));
    }, [project, editor]);

    // ===== SETUP SOCKET LISTENERS =====
    useEffect(() => {
        if (!socketRef.current || !editor) return;

        const socket = socketRef.current;
        const userId = userIdRef.current;

        const handleContentUpdate = (data) => {
            if (!data.content) return;
            isUpdatingFromRemoteRef.current = true;
            lastContentRef.current = data.content;
            const currentContent = editor.getHTML();
            if (currentContent !== data.content) {
                const { from } = editor.state.selection;
                editor.commands.setContent(data.content, false);
                try { editor.setSelection(from); } catch (e) {}
            }
            setTimeout(() => { isUpdatingFromRemoteRef.current = false; }, 50);
        };

        const handleUserTyping = (data) => {
            if (data.userId === userId) return;
            setTypingUsers((prev) => ({ ...prev, [data.userId]: { username: data.username, timestamp: Date.now() } }));
            if (typingTimersRef.current[data.userId]) clearTimeout(typingTimersRef.current[data.userId]);
            typingTimersRef.current[data.userId] = setTimeout(() => {
                setTypingUsers((prev) => { const u = { ...prev }; delete u[data.userId]; return u; });
                delete typingTimersRef.current[data.userId];
            }, TYPING_INDICATOR_TIMEOUT);
        };

        const handleOnlineUsers = (users) => {
            setCollaborators(users.filter((u) => u.userId !== userId).map((u) => ({ username: u.username, userId: u.userId, online: true })));
        };

        const handleAllCollaborators = (users) => {
            setCollaborators((prev) => prev.map((c) => ({ ...c, online: !!users.find((u) => u.userId === c.userId) })));
        };

        const handleTitleChange = (data) => { if (data.userId !== userId) setTitle(data.title); };
        const handleTagChange = (data) => { if (data.userId !== userId) setTags(data.tags); };
        const handleUserDisconnect = (data) => {
            setTypingUsers((prev) => { const u = { ...prev }; delete u[data.userId]; return u; });
            setCollaborators((prev) => prev.map((c) => c.userId === data.userId ? { ...c, online: false } : c));
        };
        const handleChatMessage = (data) => {
            setMessages((prev) => [...prev, { userId: data.userId, username: data.username, message: data.message, timestamp: new Date(data.timestamp) }]);
            if (data.userId !== activeChat && data.userId !== userIdRef.current) {
                setUnreadMessages((prev) => ({ ...prev, [data.userId]: (prev[data.userId] || 0) + 1 }));
            }
        };
        const handleCursorPosition = (data) => {
            if (data.userId === userId) return;
            setRemoteCursors((prev) => ({ ...prev, [data.userId]: { username: data.username, line: data.line, position: data.position } }));
        };

        socket.on("receive-content", handleContentUpdate);
        socket.on("user-typing", handleUserTyping);
        socket.on("online-users", handleOnlineUsers);
        socket.on("all-collaborators", handleAllCollaborators);
        socket.on("title-change", handleTitleChange);
        socket.on("tag-change", handleTagChange);
        socket.on("user-disconnect", handleUserDisconnect);
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
            if (isUpdatingFromRemoteRef.current) return;

            const text = editor.getText();
            setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
            setCharCount(text.length);

            if (socket.connected) {
                socket.emit("user-typing", { projectId, userId, username });
            }

            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

            debounceTimerRef.current = setTimeout(() => {
                const content = editor.getHTML();
                if (content !== lastContentRef.current && socket.connected) {
                    lastContentRef.current = content;
                    socket.emit("update-content", { projectId, content, userId, username }, (response) => {});
                }
            }, CONTENT_UPDATE_DELAY);
        };

        editor.on("update", handleUpdate);
        return () => {
            editor.off("update", handleUpdate);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [editor, project]);

    // ===== SAVE PROJECT =====
    const updateProject = useCallback(async () => {
        if (!project?._id) { alert("Project not found"); return; }
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const content = editor.getHTML();
            lastContentRef.current = content;
            await api.put(`/project/update/${project._id}`, { title, content, tags, lastSaved: new Date().toISOString() });
            setSaveStatus("success");
            setLastSaved(new Date());
            setTimeout(() => { nav("/dashboard"); }, 1500);
        } catch (err) {
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
            if (socketRef.current?.connected && project?._id) {
                socketRef.current.emit("tag-change", { projectId: project._id, tags: updatedTags, userId: userIdRef.current, username: usernameRef.current });
            }
        }
    }, [newTag, tags, project]);

    const removeTag = useCallback((tagToRemove) => {
        const updatedTags = tags.filter((tag) => tag !== tagToRemove);
        setTags(updatedTags);
        if (socketRef.current?.connected && project?._id) {
            socketRef.current.emit("tag-change", { projectId: project._id, tags: updatedTags, userId: userIdRef.current, username: usernameRef.current });
        }
    }, [tags, project]);

    // ===== CHAT MANAGEMENT =====
    const sendMessage = useCallback(() => {
        if (!newMessage.trim() || !socketRef.current || !activeChat) return;
        const timestamp = new Date();
        socketRef.current.emit("send-message", { projectId: projectIdRef.current, userId: userIdRef.current, username: usernameRef.current, recipientId: activeChat, message: newMessage.trim(), timestamp: timestamp.toISOString() });
        setMessages((prev) => [...prev, { userId: userIdRef.current, username: "You", message: newMessage.trim(), timestamp }]);
        setNewMessage("");
    }, [newMessage, activeChat]);

    // ===== CLEANUP =====
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            Object.values(typingTimersRef.current).forEach(clearTimeout);
            if (socketRef.current && projectIdRef.current) {
                socketRef.current.emit("leave-project", projectIdRef.current);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    if (!editor) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                <div>Loading editor...</div>
            </div>
        );
    }

    return (
        <div className="editor-page">
            {/* PROJECT ERROR BANNER */}
            {!project && (
                <div style={{ background: "#dc2626", color: "white", padding: "12px 20px", textAlign: "center", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span>❌</span>
                    <span>Error: No project loaded! Please go back and open a project from your dashboard.</span>
                    <button onClick={() => nav("/dashboard")} style={{ marginLeft: "12px", padding: "4px 12px", background: "white", color: "#dc2626", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
                        Go to Dashboard
                    </button>
                </div>
            )}

            {/* CONNECTION STATUS BANNER */}
            {project && !isSocketConnected && (
                <div style={{ background: "#ef4444", color: "white", padding: "12px 20px", textAlign: "center", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span>🔴</span>
                    <span>Offline - Trying to connect to collaboration server...</span>
                </div>
            )}

            {/* TYPING INDICATOR BANNER */}
            {Object.keys(typingUsers).length > 0 && (
                <div style={{ background: "#3b82f6", color: "white", padding: "10px 20px", textAlign: "center", fontSize: "13px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderBottom: "2px solid #1d4ed8" }}>
                    <span>✏️</span>
                    <span>{Object.values(typingUsers).map((u) => u.username).join(", ")}</span>
                    <span style={{ marginLeft: "4px" }}>{Object.keys(typingUsers).length === 1 ? "is" : "are"} typing...</span>
                </div>
            )}

            {/* HEADER */}
            <div className="editor-header">
                <button className="btn-back" onClick={() => nav(-1)} title="Go back">
                    <HiArrowLeft/>
                </button>

                <div className="editor-title-section">
                    <input
                        className="editor-title"
                        placeholder="Untitled Document"
                        value={title}
                        disabled={!isMeOwner()}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (socketRef.current?.connected && project?._id) {
                                socketRef.current.emit("title-change", { projectId: project._id, title: e.target.value, userId: userIdRef.current, username: usernameRef.current });
                            }
                        }}
                    />
                    {!isSocketConnected && (
                        <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                            ⚠️ Offline - changes will not sync
                        </div>
                    )}
                </div>

                <div className="editor-actions">
                    <button className="btn-secondary" title="Share document">
                        <CiShare1/> Share
                    </button>
                    <button className="btn-primary" onClick={updateProject} disabled={isSaving || !isMeOwner()} title={!isMeOwner() ? "Only project owner can save" : isSaving ? "Saving..." : "Save document"}>
                        <CiSaveDown2/> {isSaving ? "Saving..." : "Save"}
                    </button>
                    {saveStatus === "success" && <span className="save-status success">✓ Saved</span>}
                    {saveStatus === "error" && <span className="save-status error">✗ Error</span>}
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="toolbar">
                <div className="toolbar-group">
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""} title="Bold"><strong>B</strong></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""} title="Italic"><em>I</em></button>
                    <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "active" : ""} title="Strikethrough"><s>S</s></button>
                </div>
                <div className="toolbar-divider"></div>
                <div className="toolbar-group">
                    <button onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()} className={editor.isActive("heading", {level: 1}) ? "active" : ""} title="Heading 1"><LuHeading1/></button>
                    <button onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()} className={editor.isActive("heading", {level: 2}) ? "active" : ""} title="Heading 2"><LuHeading2/></button>
                </div>
                <div className="toolbar-divider"></div>
                <div className="toolbar-group">
                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "active" : ""} title="Bullet List">•</button>
                    <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "active" : ""} title="Ordered List">1.</button>
                    <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive("codeBlock") ? "active" : ""} title="Code Block"><MdCode/></button>
                </div>
                <div className="toolbar-divider"></div>
                <div className="toolbar-group">
                    <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "active" : ""} title="Quote"><MdFormatQuote/></button>
                </div>
                <div className="toolbar-divider"></div>
                <div className="toolbar-group">
                    <button onClick={() => editor.chain().focus().undo().run()} title="Undo">↶</button>
                    <button onClick={() => editor.chain().focus().redo().run()} title="Redo">↷</button>
                </div>

                {/* ===== AI BUTTON ===== */}
                <div className="toolbar-divider"></div>
                <div className="ai-toolbar-wrap" ref={aiPopupRef}>
                    <button
                        className={`btn-ai-toolbar ${aiPopupOpen ? "active" : ""}`}
                        onClick={() => setAiPopupOpen((p) => !p)}
                        title="AI Writing Assistant"
                    >
                        🤖 AI Assist
                    </button>

                    {/* AI POPUP */}
                    {aiPopupOpen && (
                        <div className="ai-popup">
                            <div className="ai-popup-header">
                                <span>🤖 AI Writing Assistant</span>
                                <button className="ai-popup-close" onClick={() => setAiPopupOpen(false)}>✕</button>
                            </div>

                            {!aiResult && !aiLoading && (
                                <>
                                    <p className="ai-popup-hint">
                                        {editor.state.selection.from !== editor.state.selection.to
                                            ? "✅ Text selected — choose an action"
                                            : "💡 Select text or use entire document"}
                                    </p>
                                    <div className="ai-actions-grid">
                                        {AI_ACTIONS.map((action) => (
                                            <button
                                                key={action.key}
                                                className="ai-action-btn"
                                                onClick={() => handleAiAssist(action.key)}
                                            >
                                                <span className="ai-action-label">{action.label}</span>
                                                <span className="ai-action-desc">{action.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {aiLoading && (
                                <div className="ai-loading">
                                    <div className="ai-spinner"></div>
                                    <span>Gemini is thinking...</span>
                                </div>
                            )}

                            {aiResult && !aiLoading && (
                                <div className="ai-result">
                                    <div className="ai-result-label">
                                        {AI_ACTIONS.find(a => a.key === aiAction)?.label} result:
                                    </div>
                                    <div className="ai-result-text">{aiResult}</div>
                                    <div className="ai-result-actions">
                                        <button className="ai-apply-btn" onClick={handleApplyAiResult}>
                                            ✅ Apply to Editor
                                        </button>
                                        <button className="ai-retry-btn" onClick={() => { setAiResult(""); setAiAction(""); }}>
                                            ↩ Try Again
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN EDITOR LAYOUT */}
            <div className="editor-layout" style={{opacity: project ? 1 : 0.5}}>
                <div className="editor-container" style={{pointerEvents: project ? "auto" : "none"}}>
                    <EditorContent editor={editor}/>
                </div>

                {/* RIGHT SIDEBAR */}
                <aside className="editor-sidebar">
                    <div className="sidebar-section">
                        <h3 className="sidebar-title">Document Info</h3>
                        <div className="info-item"><span className="info-label">Words:</span><span className="info-value">{wordCount}</span></div>
                        <div className="info-item"><span className="info-label">Characters:</span><span className="info-value">{charCount}</span></div>
                        <div className="info-item"><span className="info-label">Last Saved:</span><span className="info-value">{lastSaved.toLocaleTimeString()}</span></div>
                        <div className="info-item">
                            <span className="info-label">Status:</span>
                            <span className="info-value" style={{ color: isSocketConnected ? "#22c55e" : "#ef4444" }}>
                                {isSocketConnected ? "🟢 Connected" : "🔴 Offline"}
                            </span>
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3 className="sidebar-title">Tags</h3>
                        <div className="tags-container">
                            {tags.map((tag, idx) => (
                                <div key={idx} className="tag-item">
                                    <span>{tag}</span>
                                    <button className="tag-remove" onClick={() => removeTag(tag)} title="Remove tag"><MdClose/></button>
                                </div>
                            ))}
                        </div>
                        <div className="tag-input-group">
                            <input type="text" placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === "Enter" && addTag()} className="tag-input"/>
                            <button className="btn-add-tag" onClick={addTag} title="Add tag"><MdAdd/></button>
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3 className="sidebar-title">Collaborators ({collaborators.length})</h3>
                        <div className="collaborators-container">
                            {collaborators.filter((c) => c.online).length > 0 && (
                                <div className="collaborator-group">
                                    <div className="collaborator-group-title">🟢 Online</div>
                                    {collaborators.filter((c) => c.online).map((collab, idx) => {
                                        const isTyping = typingUsers[collab.userId];
                                        return (
                                            <div key={idx} className="collaborator-item">
                                                <div className="collab-avatar online" title={collab.username}>{collab.username?.[0]?.toUpperCase() || "?"}</div>
                                                <div className="collab-info">
                                                    <div className="collab-username">{collab.username}</div>
                                                    <div className={`collab-status ${isTyping ? "typing" : "online"}`}>
                                                        <span className="status-dot"/>
                                                        {isTyping ? (<><span style={{fontWeight: "600"}}>typing</span><span className="typing-indicator" style={{marginLeft: "4px"}}><span>.</span><span>.</span><span>.</span></span></>) : "Online"}
                                                    </div>
                                                </div>
                                                <button className="btn-chat" onClick={() => { setActiveChat(collab.userId); setUnreadMessages((prev) => ({ ...prev, [collab.userId]: 0 })); }} title="Chat">
                                                    💬
                                                    {unreadMessages[collab.userId] > 0 && <span className="notification-badge">{unreadMessages[collab.userId]}</span>}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {collaborators.filter((c) => !c.online).length > 0 && (
                                <div className="collaborator-group">
                                    <div className="collaborator-group-title">🔴 Offline</div>
                                    {collaborators.filter((c) => !c.online).map((collab, idx) => (
                                        <div key={idx} className="collaborator-item">
                                            <div className="collab-avatar offline" title={collab.username}>{collab.username?.[0]?.toUpperCase() || "?"}</div>
                                            <div className="collab-info">
                                                <div className="collab-username">{collab.username}</div>
                                                <div className="collab-status offline"><span className="status-dot"/>Offline</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {activeChat && (
                        <div className="chat-modal">
                            <div className="chat-modal-header">
                                <div className="chat-modal-title">{collaborators.find((c) => c.userId === activeChat)?.username || "Chat"}</div>
                                <button className="chat-modal-close" onClick={() => setActiveChat(null)} title="Close chat">✕</button>
                            </div>
                            <div className="messages-container">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.userId === userIdRef.current ? "sent" : "received"}`}>
                                        <div className="message-username">{msg.username}</div>
                                        <div className="message-content">{msg.message}</div>
                                        <div className="message-time">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="message-input-group">
                                <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} className="message-input" autoFocus/>
                                <button className="btn-send" onClick={sendMessage} title="Send message">➤</button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};
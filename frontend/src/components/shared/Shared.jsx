import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RiFolderReceivedLine } from "react-icons/ri";
import { MdSearch, MdSort, MdPeopleOutline } from "react-icons/md";
import { HiOutlineLogout } from "react-icons/hi";
import { IoMailOpenOutline } from "react-icons/io5";
import api from "../api/api";
import "./Shared.css";

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const getActivityHint = (date) => {
  const hours = (Date.now() - new Date(date).getTime()) / 3600000;
  if (hours < 1)   return { color: "#16a34a", label: "Just updated" };
  if (hours < 24)  return { color: "#2563eb", label: "Updated today" };
  if (hours < 168) return { color: "#d97706", label: "Updated this week" };
  return { color: null, label: null };
};

export const Shared = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [projects, setProjects]         = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [sortBy, setSortBy]             = useState("recent");
  const [leavingId, setLeavingId]       = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const [projResp, invResp] = await Promise.all([
          api.get(`/project/user/${userId}`),
          api.get(`/invitations/${userId}`),
        ]);
        const shared = projResp.data.filter(
          (p) => p.owner?._id !== userId &&
                 p.collaborators?.some((c) => c._id === userId)
        );
        setProjects(shared);
        setPendingCount(invResp.data.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleLeave = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Leave this project? You will lose access.")) return;
    setLeavingId(projectId);
    try {
      await api.put(`/project/leave/${projectId}`, { userId });
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to leave project.");
    } finally {
      setLeavingId(null);
    }
  };

  const openProject = (project) =>
    navigate(`/dashboard/details/${project._id}`, { state: { project } });

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.owner?.username?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "alpha")  list.sort((a, b) => a.title.localeCompare(b.title));
    else                     list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return list;
  }, [projects, search, sortBy]);

  const isEmpty = !loading && projects.length === 0;

  return (
    <div className="shared-page">

      {/* ── Header ── */}
      <div className="shared-header">
        <div className="shared-title-row">
          <div className="shared-title">
            <RiFolderReceivedLine size={22} />
            <h2>Shared with you</h2>
            {!isEmpty && (
              <span className="shared-count">{projects.length}</span>
            )}
          </div>
          <p className="shared-subtitle">
            Projects teammates have invited you to collaborate on.
          </p>
        </div>

        {/* Pending invites banner */}
        {pendingCount > 0 && (
          <div className="pending-banner">
            <IoMailOpenOutline size={16} />
            <span>
              You have <strong>{pendingCount} pending invitation{pendingCount > 1 ? "s" : ""}</strong>
              {" "}— check the 🔔 bell to accept.
            </span>
          </div>
        )}

        {/* Controls — hidden when empty */}
        {!isEmpty && (
          <div className="shared-controls">
            <div className="shared-search">
              <MdSearch size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by project or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="shared-sort">
              <MdSort size={16} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recent">Recently updated</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="shared-empty">
          <div className="shared-spinner" />
          <p>Loading shared projects...</p>
        </div>

      ) : isEmpty ? (
        /* ── Improved empty state ── */
        <div className="shared-empty">
          <div className="empty-illustration">
            <div className="empty-circle outer" />
            <div className="empty-circle inner" />
            <RiFolderReceivedLine size={40} className="empty-folder-icon" />
          </div>
          <h3>No shared projects yet</h3>
          <p>
            Projects shared with you will appear here.<br />
            Ask a teammate to invite you to collaborate.
          </p>
          {pendingCount > 0 && (
            <p className="empty-hint">
              🔔 You have <strong>{pendingCount} pending invite{pendingCount > 1 ? "s" : ""}</strong> — accept from the bell menu.
            </p>
          )}
          <div className="empty-tips">
            <div className="tip-item">
              <span className="tip-num">1</span>
              <span>Ask a teammate to open their project</span>
            </div>
            <div className="tip-item">
              <span className="tip-num">2</span>
              <span>They click "Add Collaborator" and search your email</span>
            </div>
            <div className="tip-item">
              <span className="tip-num">3</span>
              <span>Accept the invite from your 🔔 notifications</span>
            </div>
          </div>
        </div>

      ) : filtered.length === 0 ? (
        <div className="shared-empty">
          <MdSearch size={40} className="empty-icon" />
          <h3>No results for "{search}"</h3>
          <p>Try a different project name or owner.</p>
          <button className="empty-cta secondary" onClick={() => setSearch("")}>
            Clear search
          </button>
        </div>

      ) : (
        <div className="shared-grid">
          {filtered.map((project) => {
            const hint = getActivityHint(project.updatedAt);
            return (
              <div
                key={project._id}
                className="shared-card"
                onClick={() => openProject(project)}
              >
                {hint.color && (
                  <div
                    className="shared-activity-dot"
                    style={{ background: hint.color }}
                    title={hint.label}
                  />
                )}

                <div className="shared-card-header">
                  <span className="shared-card-title">{project.title}</span>
                  <span className="shared-badge collaborator">Collaborator</span>
                </div>

                {/* Owner — key differentiator */}
                <div className="shared-owner">
                  <div className="owner-avatar">
                    {project.owner?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="owner-info">
                    <span className="owner-label">Shared by</span>
                    <span className="owner-name">{project.owner?.username}</span>
                  </div>
                </div>

                <div className="shared-card-body">
                  <div className="shared-info">
                    <MdPeopleOutline size={14} />
                    <span>
                      {project.collaborators.length} collaborator
                      {project.collaborators.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {project.tags?.length > 0 && (
                    <div className="shared-tags">
                      {project.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="shared-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shared-card-footer">
                  <span
                    className="shared-time"
                    style={{ color: hint.color || "var(--text-muted)" }}
                  >
                    🕒 {timeAgo(project.updatedAt)}
                    {hint.label && <span className="activity-hint"> · {hint.label}</span>}
                  </span>
                  <div className="shared-actions">
                    <button
                      className="shared-leave-btn"
                      onClick={(e) => handleLeave(e, project._id)}
                      disabled={leavingId === project._id}
                      title="Leave project"
                    >
                      <HiOutlineLogout size={14} />
                      {leavingId === project._id ? "..." : "Leave"}
                    </button>
                    <button
                      className="shared-open-btn"
                      onClick={(e) => { e.stopPropagation(); openProject(project); }}
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
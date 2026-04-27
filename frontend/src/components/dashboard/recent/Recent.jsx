import { useEffect, useState } from "react";
import { MdOutlineRecentActors } from "react-icons/md";
import api from "../../api/api";
import "./Recent.css";

const ACTION_LABELS = {
  project_created:     { label: "Created project",      color: "#16a34a", bg: "#dcfce7" },
  project_updated:     { label: "Updated project",      color: "#2563eb", bg: "#dbeafe" },
  project_deleted:     { label: "Moved to trash",       color: "#dc2626", bg: "#fee2e2" },
  project_restored:    { label: "Restored project",     color: "#d97706", bg: "#fef3c7" },
  collaborator_added:  { label: "Added collaborator",   color: "#7c3aed", bg: "#ede9fe" },
  collaborator_removed:{ label: "Removed collaborator", color: "#db2777", bg: "#fce7f3" },
  tag_added:           { label: "Added tag",            color: "#0891b2", bg: "#cffafe" },
  tag_removed:         { label: "Removed tag",          color: "#64748b", bg: "#f1f5f9" },
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const Recent = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetch = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const resp = await api.get(`/activity/recent/${userId}`);
        setActivities(resp.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const filtered = filter === "all"
    ? activities
    : activities.filter((a) => a.action === filter);

  return (
    <div className="recent-page">
      <div className="recent-header">
        <div className="recent-title">
          <MdOutlineRecentActors size={22} />
          <h2>Recent Activity</h2>
        </div>
        <p className="recent-subtitle">Track all changes across your projects.</p>
      </div>

      {/* Filter tabs */}
      <div className="recent-filters">
        {["all", "project_created", "project_updated", "project_deleted", "collaborator_added"].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : ACTION_LABELS[f]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="recent-empty"><p>Loading...</p></div>
      ) : filtered.length === 0 ? (
        <div className="recent-empty">
          <MdOutlineRecentActors size={48} className="recent-empty-icon" />
          <h3>No activity yet</h3>
          <p>Actions on your projects will appear here.</p>
        </div>
      ) : (
        <div className="activity-timeline">
          {filtered.map((activity, idx) => {
            const info = ACTION_LABELS[activity.action] || { label: activity.action, color: "#64748b", bg: "#f1f5f9" };
            return (
              <div key={activity._id} className="activity-item">
                <div className="activity-line">
                  <div className="activity-dot" style={{ background: info.color }} />
                  {idx < filtered.length - 1 && <div className="activity-connector" />}
                </div>
                <div className="activity-content">
                  <div className="activity-top">
                    <span className="activity-badge" style={{ color: info.color, background: info.bg }}>
                      {info.label}
                    </span>
                    <span className="activity-time">{timeAgo(activity.createdAt)}</span>
                  </div>
                  <div className="activity-project">
                    📁 <strong>{activity.project?.title || "Deleted Project"}</strong>
                  </div>
                  <div className="activity-user">
                    by <strong>{activity.user?.username || "Unknown"}</strong>
                  </div>
                  {activity.metadata?.collaboratorName && (
                    <div className="activity-meta">
                      👤 {activity.metadata.collaboratorName}
                    </div>
                  )}
                  {activity.metadata?.titleChanged && (
                    <div className="activity-meta">
                      "{activity.metadata.oldTitle}" → "{activity.metadata.newTitle}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

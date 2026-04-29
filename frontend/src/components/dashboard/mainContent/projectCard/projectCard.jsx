import "./projectCard.css";
import { MdPeopleOutline, MdOutlineTag, MdAccessTime } from "react-icons/md";
import { GoProjectRoadmap } from "react-icons/go";

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

export default function ProjectCard({ project, onOpen }) {
  const userId = localStorage.getItem("userId");
  const isOwner = project.owner._id === userId;
  const isCollaborator = project.collaborators.some((c) => c._id === userId);

  // Collaborator avatars (max 3)
  const visibleCollabs = project.collaborators.slice(0, 3);
  const extraCollabs = project.collaborators.length - 3;

  return (
    <div className="project-card" onClick={onOpen}>

      {/* Header */}
      <div className="card-header">
        <div className="card-title-row">
          <div className="card-icon">
            <GoProjectRoadmap size={14} />
          </div>
          <span className="project-title">{project.title}</span>
        </div>
        {isOwner && <span className="badge owner">Owner</span>}
        {!isOwner && isCollaborator && <span className="badge collaborator">Collab</span>}
      </div>

      {/* Description if available */}
      {project.desc && (
        <p className="card-desc">{project.desc}</p>
      )}

      {/* Tags */}
      {project.tags?.length > 0 && (
        <div className="card-tags">
          <MdOutlineTag size={12} className="tags-icon" />
          {project.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="card-tag">{tag}</span>
          ))}
          {project.tags.length > 3 && (
            <span className="card-tag muted">+{project.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div className="card-meta">
          {/* Collaborator avatars */}
          <div className="collab-avatars">
            {visibleCollabs.map((c, i) => (
              <div
                key={i}
                className="collab-avatar"
                title={c.username}
                style={{ zIndex: visibleCollabs.length - i }}
              >
                {c.username?.charAt(0).toUpperCase()}
              </div>
            ))}
            {extraCollabs > 0 && (
              <div className="collab-avatar extra">+{extraCollabs}</div>
            )}
            {project.collaborators.length === 0 && (
              <span className="no-collabs">
                <MdPeopleOutline size={13} /> Solo
              </span>
            )}
          </div>

          {/* Time */}
          <span className="card-time">
            <MdAccessTime size={12} />
            {timeAgo(project.updatedAt)}
          </span>
        </div>

        <button
          className="open-btn"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
        >
          Open
        </button>
      </div>
    </div>
  );
}
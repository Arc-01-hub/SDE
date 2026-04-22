import "./projectCard.css";

export default function ProjectCard({ project, onOpen }) {
  const userId = localStorage.getItem("userId");

  const isOwner = project.owner._id === userId;
  const isCollaborator = project.collaborators.some((c) => c._id === userId);

  const UpdateFormat = new Date(project.updatedAt);
  return (
    <div className="project-card" onClick={onOpen}>
      <div className="card-header">
        <span className="project-title">{project.title}</span>
      </div>

      <div className="card-body">
        <div className="info">
          <span>{project.collaborators.length} collaborators</span>
        </div>

        <div className="info">
          <span>
            Updated{" "}
            <span className="date small-text">
              {UpdateFormat.toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      <div className="card-footer">
        {isOwner && <span className="badge owner">Owner</span>}
        {!isOwner && isCollaborator && (
          <span className="badge collaborator">Collaborator</span>
        )}

        <button onClick={onOpen}>Open</button>
      </div>
    </div>
  );
}

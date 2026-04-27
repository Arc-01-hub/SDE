import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoTrashBinOutline } from "react-icons/io5";
import { MdRestoreFromTrash, MdDeleteForever } from "react-icons/md";
import api from "../../api/api";
import "./Trash.css";

export const Trash = () => {
  const [trashedProjects, setTrashedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const userId = localStorage.getItem("userId");
  const nav = useNavigate();

  const fetchTrashed = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const resp = await api.get(`/project/trash/${userId}`);
      setTrashedProjects(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashed();
  }, [userId]);

  const handleRestore = async (id) => {
    setActionLoading(id + "restore");
    try {
      await api.put(`/project/restore/${id}`);
      setTrashedProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete this project? This cannot be undone.")) return;
    setActionLoading(id + "delete");
    try {
      await api.delete(`/project/permanent/${id}`);
      setTrashedProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="trash-page">
      <div className="trash-header">
        <div className="trash-title">
          <IoTrashBinOutline size={22} />
          <h2>Trash</h2>
        </div>
        <p className="trash-subtitle">
          Projects moved to trash. Restore or permanently delete them.
        </p>
      </div>

      {loading ? (
        <div className="trash-empty">
          <p>Loading...</p>
        </div>
      ) : trashedProjects.length === 0 ? (
        <div className="trash-empty">
          <IoTrashBinOutline size={48} className="trash-empty-icon" />
          <h3>Trash is empty</h3>
          <p>No deleted projects found.</p>
        </div>
      ) : (
        <div className="trash-grid">
          {trashedProjects.map((project) => (
            <div key={project._id} className="trash-card">
              <div className="trash-card-info">
                <h3>{project.title || "Untitled Project"}</h3>
                {project.desc && <p>{project.desc}</p>}
                <span className="trash-card-date">
                  Deleted: {new Date(project.updatedAt).toLocaleDateString()}
                </span>
                {project.tags?.length > 0 && (
                  <div className="trash-tags">
                    {project.tags.map((tag, i) => (
                      <span key={i} className="trash-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="trash-card-actions">
                <button
                  className="btn-restore"
                  onClick={() => handleRestore(project._id)}
                  disabled={actionLoading === project._id + "restore"}
                >
                  <MdRestoreFromTrash size={16} />
                  {actionLoading === project._id + "restore" ? "Restoring..." : "Restore"}
                </button>
                <button
                  className="btn-permanent-delete"
                  onClick={() => handlePermanentDelete(project._id)}
                  disabled={actionLoading === project._id + "delete"}
                >
                  <MdDeleteForever size={16} />
                  {actionLoading === project._id + "delete" ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

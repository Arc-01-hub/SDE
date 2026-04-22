import { useContext, useState } from "react";
import "./createProject.css";
import { CiSquarePlus } from "react-icons/ci";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { ProjectsContext } from "../ProjectsContext";

export const CreateProject = () => {
  const { refreshProjects } = useContext(ProjectsContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [tagsArray, setTagsArray] = useState([]);
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userId = localStorage.getItem("userId");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/project/create", {
        title: title.trim(),
        userId,
        tags: tagsArray.length ? tagsArray : (tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : []),
        desc: desc.trim(),
      });
      await refreshProjects();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addTagFromInput = (value) => {
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setTagsArray((prev) => {
      const next = [...prev];
      parts.forEach((p) => { if (!next.includes(p)) next.push(p); });
      return next;
    });
  };

  const handleTagsKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tags.trim()) {
        addTagFromInput(tags);
        setTags("");
      }
    }
  };

  const handleTagsBlur = () => {
    if (tags.trim()) {
      addTagFromInput(tags);
      setTags("");
    }
  };

  const removeTag = (idx) => setTagsArray((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="create-project-page">
      <div className="card-form">
        <div className="card-header">
          <h2>
            <CiSquarePlus size={22} /> Create New Project
          </h2>
          <p className="lead">Add a concise title and a short description (short).</p>
        </div>

        <form className="create-project-form" onSubmit={handleSubmit} aria-label="Create project form">
          <div className="field">
            <label htmlFor="project-title">Project Title</label>
            <input
              id="project-title"
              type="text"
              placeholder="Enter project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              aria-required="true"
              maxLength={80}
            />
            <div className="field-foot">
              <small className="helper-text">Keep it short and descriptive.</small>
              <span className="char-count" aria-live="polite">{title.length}/80</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              placeholder="short description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              maxLength={300}
            />
            <div className="field-foot">
              <small className="helper-text">Optional — brief summary of the project.</small>
              <span className="char-count">{desc.length}/300</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="project-tags">Tags (comma separated)</label>
            <input
              id="project-tags"
              type="text"
              placeholder="marketing, UI, backend"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onKeyDown={handleTagsKeyDown}
              onBlur={handleTagsBlur}
              aria-describedby="tags-help"
            />
            <small id="tags-help" className="helper-text">Use commas to separate multiple tags.</small>
            {tagsArray.length > 0 && (
              <div className="tags-list" aria-label="Selected tags">
                {tagsArray.map((t, i) => (
                  <span key={t} className="tag-chip">
                    {t}
                    <button type="button" className="remove" onClick={() => removeTag(i)} aria-label={`Remove tag ${t}`}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !title.trim()}
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

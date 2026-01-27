import { useContext, useState } from "react";
import "./createProject.css";
import { CiSquarePlus } from "react-icons/ci";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { ProjectsContext } from "../dashboard";

export const CreateProject = () => {
  // const { getProjects } = useContext(ProjectsContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [tags, setTags] = useState("");
  const userId = localStorage.getItem("userId");
  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = {
      title,
      userId,
      // collaborators: selectedCollaborators,
      tags: tags.split(",").map((t) => t.trim()),
    };
    onCreate(projectData);
  };

  const onCreate = (projectData) => {
    api
      .post("/project/create", projectData)
      .then((resp) => {
        // getProjects();
        closeModal();
        setTitle("");
        setSelectedCollaborators("");
        setTags("");
      })
      .catch((err) => console.log(err));
  };

  const toggleCollaborator = (id) => {
    if (selectedCollaborators.includes(id)) {
      setSelectedCollaborators(selectedCollaborators.filter((c) => c !== id));
    } else {
      setSelectedCollaborators([...selectedCollaborators, id]);
    }
  };
  const closeModal = () => {
    // navigate("/dashboard");
  };

  return (
    <div className="create-project-page">
      <h2>
        <CiSquarePlus />
        Create New Project
      </h2>
      <form className="create-project-form" onSubmit={handleSubmit}>
        {/* Title */}
        <label>Project Title</label>
        <input
          type="text"
          placeholder="Enter project title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Collaborators */}
        <label>Collaborators</label>
        <div className="collaborators-list">
          {/* {users.map((user) => (
            <button
              type="button"
              key={user._id}
              className={
                selectedCollaborators.includes(user._id)
                  ? "collaborator selected"
                  : "collaborator"
              }
              onClick={() => toggleCollaborator(user._id)}
            >
              {user.name}
            </button>
          ))} */}
        </div>

        {/* Tags */}
        <label>Tags (comma separated)</label>
        <input
          type="text"
          placeholder="marketing, UI, backend"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {/* Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Create Project
          </button>
          {/* <button type="button" className="btn-secondary" onClick={closeModal}>
            Cancel
          </button> */}
        </div>
      </form>
    </div>
  );
};

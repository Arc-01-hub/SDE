import "./mainContent.css";
import ProjectCard from "./projectCard/projectCard";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export const MainContent = ({ projects }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const openModal = () => {
    // document.querySelector(".modal-box").classList.add("active");
    navigate("/dashboard/create");
  };

  const totalProjects = projects.length;
  const ownerProjects = projects.filter((p) => p.owner._id === userId).length;
  const collaboratorProjects = projects.filter(
    (p) =>
      p.owner._id !== userId && p.collaborators.some((c) => c._id === userId)
  ).length;
  // NAVIGATE TO PROJECT DETAILS PAGE
    const openProject = (projectId) => {
      openModal();
      navigate(`/dashboard/details/${projectId}`);
    };
  return (
    <div className="main-content">
      <div className="state-section">
        <div className="state-card">
          <span>Total Projects</span>
          <h3>{totalProjects}</h3>
        </div>
        <div className="state-card">
          <span>Your Projects</span>
          <h3>{ownerProjects}</h3>
        </div>
        <div className="state-card">
          <span>Collaborator Projects</span>
          <h3>{collaboratorProjects}</h3>
        </div>
      </div>

      <div className="documents-section">
        <h3>Projects </h3>
        <div className="projects-container">
          <div className="project-card create-card">
            <button id="create_project" onClick={openModal}>
              <MdOutlineCreateNewFolder />
              <p>Create New Project</p>
            </button>
          </div>

          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onOpen={() => openProject(project._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

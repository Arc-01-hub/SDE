import { useContext, useEffect, useState } from "react";
import "./mainContent.css";
import ProjectCard from "./projectCard/projectCard";
import { MdOutlineCreateNewFolder, MdSearch } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ProjectsContext } from "../ProjectsContext";

export const MainContent = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { projects } = useContext(ProjectsContext);
  const [filterBy, setFilterBy] = useState("all");
  const [filteredProject, setFilteredProjects] = useState([]);
  const [search, setSearch] = useState("");

  const totalProjects = projects.length;
  const ownerProjects = projects.filter((p) => p.owner._id === userId);
  const collaboratorProjects = projects.filter(
    (p) => p.owner._id !== userId && p.collaborators.some((c) => c._id === userId)
  );

  const openProject = (project) => {
    navigate(`/dashboard/details/${project._id}`, { state: { project } });
  };

  useEffect(() => {
    let base = projects;
    if (filterBy === "mine") base = ownerProjects;
    else if (filterBy === "collab") base = collaboratorProjects;

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    setFilteredProjects(base);
  }, [filterBy, projects, search]);

  return (
    <div className="main-content">

      {/* ── Stats ── */}
      <div className="state-section">
        <div className={`state-card ${filterBy === "all" ? "active" : ""}`} onClick={() => setFilterBy("all")}>
          <span>Total Projects</span>
          <h3>{totalProjects}</h3>
        </div>
        <div className={`state-card ${filterBy === "mine" ? "active" : ""}`} onClick={() => setFilterBy("mine")}>
          <span>Your Projects</span>
          <h3>{ownerProjects.length}</h3>
        </div>
        <div className={`state-card ${filterBy === "collab" ? "active" : ""}`} onClick={() => setFilterBy("collab")}>
          <span>Collaborator Projects</span>
          <h3>{collaboratorProjects.length}</h3>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="content-toolbar">
        <h3>Projects
          {filterBy !== "all" && (
            <span className="filter-active-badge">
              {filterBy === "mine" ? "Mine" : "Collaborations"}
            </span>
          )}
        </h3>
        <div className="toolbar-search">
          <MdSearch size={15} className="toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Projects grid ── */}
      <div className="documents-section">
        <div className="projects-container">
          <div className="project-card create-card">
            <button id="create_project" onClick={() => navigate("/dashboard/create")}>
              <MdOutlineCreateNewFolder />
              <p>Create New Project</p>
            </button>
          </div>
          {filteredProject.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onOpen={() => openProject(project)}
            />
          ))}
        </div>

        {/* Empty search state */}
        {filteredProject.length === 0 && search && (
          <div className="empty-search">
            <MdSearch size={36} />
            <p>No projects found for "<strong>{search}</strong>"</p>
            <button onClick={() => setSearch("")}>Clear search</button>
          </div>
        )}
      </div>
    </div>
  );
};
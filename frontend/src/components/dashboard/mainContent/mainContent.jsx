import { use, useContext, useEffect, useState } from "react";
import "./mainContent.css";
import ProjectCard from "./projectCard/projectCard";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ProjectsContext } from "../ProjectsContext";

export const MainContent = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { projects } = useContext(ProjectsContext);
  const [filterBy,setFilterBy] = useState("all");
  const [filtredProject,setFiltredProjects] = useState([]);

  const openModal = () => {
    navigate("/dashboard/create");
  };



  const totalProjects = projects.length;
  const ownerProjects = projects.filter((p) => p.owner._id === userId);
  const collaboratorProjects = projects.filter(
    (p) =>
      p.owner._id !== userId && p.collaborators.some((c) => c._id === userId)
        );
  const openProject = (project) => {
            openModal();
            navigate(`/dashboard/details/${project._id}`, { state: { project } });
      };

  useEffect(()=>{
    if(filterBy =="mine"){
      setFiltredProjects(ownerProjects)
    }else if(filterBy =="collab"){
      setFiltredProjects(collaboratorProjects)
    }
    else{
      setFiltredProjects(projects)
    }
  },[filterBy,projects])

  return (
    <div className="main-content">
      <div className="state-section">
        <div className="state-card" onClick={()=>setFilterBy("all")}>
          <span>Total Projects</span>
          <h3>{totalProjects}</h3>
        </div>
        <div className="state-card" onClick={()=>setFilterBy("mine")}>
          <span>Your Projects</span>
          <h3>{ownerProjects.length}</h3>
        </div>
        <div className="state-card" onClick={()=>setFilterBy("collab")}>
          <span>Collaborator Projects</span>
          <h3>{collaboratorProjects.length}</h3>
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

          {filtredProject.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onOpen={() => openProject(project)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

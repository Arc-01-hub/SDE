import { CiCalendarDate } from "react-icons/ci";
import ProjectCard from "../mainContent/projectCard/projectCard";
import "./projectDetails.css";
import { IoPersonAddOutline, IoPersonOutline } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiFolder, HiOutlineUserAdd, HiTrash } from "react-icons/hi";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { ImFileEmpty } from "react-icons/im";
import api from "../../api/api";

export const ProjectDetails = () => {
  const initialProject = useLocation().state?.project;
  const projectId = initialProject?._id;
  const [project, setProject] = useState(initialProject || null);
  const [isLoading, setIsLoading] = useState(!initialProject);
  const nav = useNavigate();
  const [cleanHTML, setCleanHTML] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState([]);
  const [allEmails, setAllEmails] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");

  const getProjectDetails = async () => {
    try {
      const response = await api.get(`/project/${projectId}`);
      setProject(response.data);
      setIsLoading(false);
      return response.data;
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };
  const getEmails = async () => {
    try {
      const response = await api.get(`/users/emails`);
      setAllEmails(response.data);
      return response.data;
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (project?.content) {
      const sanitizedHTML = DOMPurify.sanitize(project.content);
      setCleanHTML(sanitizedHTML);
    } else {
      setCleanHTML('<div class="no-content"><p>No content available</p></div>');
    }
    console.log(project);
  }, [project, nav]);
  useEffect(() => {
    if (!projectId) {
      nav("/dashboard");
    }
    getProjectDetails();
    getEmails();
  }, [projectId]);

  const handleAddCollaborator = async (email) => {
    console.log(email);
    if (!project?._id) {
      alert("Project not found");
      return;
    }
    try {
      const response = await api.post(
        `/project/add-collaborator/${project._id}`,
        {
          email: email,
        },
      );
      alert("Collaborator added successfully");
      getProjectDetails();
    } catch (err) {
      console.error("Failed to add collaborator:", err);
      alert("Failed to add collaborator");
    }
    setShowModal(false);
  };
  return (
    <div className="project-details">
      <div className="project-header">
        <div className="title-card">
          <h2>{project?.title || "Untitled Project"}</h2>
          <p>{project?.desc || ""}</p>
        </div>
      </div>

      <div className="project-info">
        <div
          className="project-display project-demo"
          dangerouslySetInnerHTML={{ __html: cleanHTML }}
        />

        <div className="project-users">
          <div className="card project-date">
            <div className="meta-row">
              <div>
                <h4>Date</h4>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {project?.createdAt
                    ? new Date(project.createdAt).toLocaleDateString()
                    : "No date available"}
                </div>
              </div>
              <div className="meta-pill">
                <CiCalendarDate />
              </div>
            </div>
          </div>

          <div className="card project-owner">
            <h4>Owner</h4>
            <div className="meta-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="avatar">
                  {project?.owner?.username
                    ? project.owner.username.charAt(0).toUpperCase()
                    : "O"}
                </div>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>
                  {project?.owner?.username || "No owner available"}
                </div>
              </div>
            </div>
          </div>

          <div className="card project-collaborators">
            <h4>Collaborators</h4>
            <div className="collaborators-list">
              {project?.collaborators?.length > 0 ? (
                project.collaborators.map((collab, index) => {
                  const name = collab?.username || collab || "User";
                  return (
                    <div key={index} className="collaborator">
                      <div className="avatar">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div
                        style={{ minWidth: 0, fontSize: "13px" }}
                        className="collab_name"
                      >
                        {name}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  No collaborators yet
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h4>Tags</h4>
            <div className="project-tags">
              {project?.tags?.length ? (
                project.tags.map((tag, i) => (
                  <div key={i} className="tag">
                    {tag}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  No tags
                </div>
              )}
            </div>
          </div>

          <div className="project-actions">
            <button
              onClick={() => nav("/editor", { state: { project } })}
              className="btn btn-outline"
              disabled={!project || isLoading}
            >
              <HiFolder style={{ marginRight: 8 }} /> Edit Project
            </button>
            {localStorage.getItem("userId") === project?.owner?._id && (
              <>
                <button
                  className="btn btn-addCollaborator"
                  onClick={() => setShowModal(true)}
                >
                  <HiOutlineUserAdd style={{ marginRight: 8 }} /> Add
                  Collaborator
                </button>
                <button className="btn btn-danger">
                  <HiTrash style={{ marginRight: 8 }} /> Delete Project
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="modal-back"
        style={{ display: showModal ? "flex" : "none" }}
      >
        <div className="modal-content card">
          <h3>Add Collaborator</h3>
          <input
            type="email"
            placeholder="Enter collaborator email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <div className="collaborator-info">
            {allEmails
              .filter(
                (email) =>
                  email.includes(searchEmail) && searchEmail.length > 0,
              )
              .map((email, index) => (
                <div key={index} className="collaborator-item">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div className="avatar">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span>{email}</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddCollaborator(email)}
                  >
                    Add
                  </button>
                </div>
              ))}
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

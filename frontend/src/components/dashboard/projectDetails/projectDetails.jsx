import { CiCalendarDate } from "react-icons/ci";
import "./projectDetails.css";
import { useLocation, useNavigate } from "react-router-dom";
import { HiFolder, HiOutlineUserAdd, HiTrash } from "react-icons/hi";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import api from "../../api/api";
import { MdCheck, MdClose } from "react-icons/md";

export const ProjectDetails = () => {
  const initialProject = useLocation().state?.project;
  const projectId = initialProject?._id;
  const [project, setProject] = useState(initialProject || null);
  const [isLoading, setIsLoading] = useState(!initialProject);
  const nav = useNavigate();
  const [cleanHTML, setCleanHTML] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [allEmails, setAllEmails] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState(""); // success | error | ""
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviting, setInviting] = useState(false);

  const userId = localStorage.getItem("userId");

  const getProjectDetails = async () => {
    try {
      const response = await api.get(`/project/${projectId}`);
      setProject(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const getEmails = async () => {
    try {
      const response = await api.get(`/users/emails`);
      setAllEmails(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (project?.content) {
      setCleanHTML(DOMPurify.sanitize(project.content));
    } else {
      setCleanHTML('<div class="no-content"><p>No content available</p></div>');
    }
  }, [project]);

  useEffect(() => {
    if (!projectId) { nav("/dashboard"); return; }
    getProjectDetails();
    getEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleSendInvite = async (email) => {
    setInviting(true);
    setInviteStatus("");
    setInviteMsg("");
    try {
      await api.post("/invitations/send", {
        projectId: project._id,
        recipientEmail: email,
        senderId: userId,
      });
      setInviteStatus("success");
      setInviteMsg(`Invitation sent to ${email}!`);
      setSearchEmail("");
      setTimeout(() => { setShowModal(false); setInviteStatus(""); setInviteMsg(""); }, 1800);
    } catch (err) {
      setInviteStatus("error");
      setInviteMsg(err?.response?.data?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await api.delete(`/project/${project._id}`);
      nav("/dashboard");
    } catch (err) {
      alert("Failed to delete project.");
    }
  };

  const filteredEmails = allEmails.filter(
    (email) => email.includes(searchEmail) && searchEmail.length > 0
  );

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
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {project?.createdAt
                    ? new Date(project.createdAt).toLocaleDateString()
                    : "No date available"}
                </div>
              </div>
              <div className="meta-pill"><CiCalendarDate /></div>
            </div>
          </div>

          <div className="card project-owner">
            <h4>Owner</h4>
            <div className="meta-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="avatar">
                  {project?.owner?.username?.charAt(0).toUpperCase() || "O"}
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
                      <div className="avatar">{name.charAt(0).toUpperCase()}</div>
                      <div style={{ minWidth: 150, fontSize: "13px" }} className="collab_name">
                        {name}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  No collaborators yet
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h4>Tags</h4>
            <div className="project-tags">
              {project?.tags?.length ? (
                project.tags.map((tag, i) => <div key={i} className="tag">{tag}</div>)
              ) : (
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>No tags</div>
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
            {userId === project?.owner?._id && (
              <>
                <button
                  className="btn btn-addCollaborator"
                  onClick={() => { setShowModal(true); setInviteStatus(""); setInviteMsg(""); }}
                >
                  <HiOutlineUserAdd style={{ marginRight: 8 }} /> Add Collaborator
                </button>
                <button className="btn btn-danger" onClick={handleDeleteProject}>
                  <HiTrash style={{ marginRight: 8 }} /> Delete Project
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <div className="modal-back" style={{ display: showModal ? "flex" : "none" }}>
        <div className="modal-content card">
          <h3>Invite Collaborator</h3>
          <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>
            An invitation will be sent to their notification bell.
          </p>
          <input
            type="email"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => { setSearchEmail(e.target.value); setInviteStatus(""); setInviteMsg(""); }}
            autoFocus
          />

          {inviteStatus && (
            <div className={`invite-alert ${inviteStatus}`}>
              {inviteStatus === "success" ? <MdCheck size={15} /> : <MdClose size={15} />}
              {inviteMsg}
            </div>
          )}

          <div className="collaborator-info">
            {filteredEmails.map((email, index) => (
              <div key={index} className="collaborator-item">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="avatar">{email.charAt(0).toUpperCase()}</div>
                  <span style={{ fontSize: "13px" }}>{email}</span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSendInvite(email)}
                  disabled={inviting}
                >
                  {inviting ? "Sending..." : "Invite"}
                </button>
              </div>
            ))}
            {searchEmail.length > 0 && filteredEmails.length === 0 && (
              <div style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
                No users found
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => { setShowModal(false); setInviteStatus(""); setInviteMsg(""); setSearchEmail(""); }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
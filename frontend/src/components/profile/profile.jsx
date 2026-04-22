import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./profile.css";
import { MdEdit, MdCheck, MdClose, MdLock, MdPerson, MdArrowBack } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";

export const Profile = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [userData, setUserData] = useState({
    username: localStorage.getItem("userName") || "",
    email: localStorage.getItem("userEmail") || "",
  });

  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [fieldSuccess, setFieldSuccess] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [stats, setStats] = useState({
    totalProjects: 0,
    ownedProjects: 0,
    collaborations: 0,
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (editField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editField]);

  const fetchUserStats = async () => {
    try {
      const resp = await api.get(`/project/user/${userId}`);
      const projects = resp.data;
      const owned = projects.filter(
        (p) => p.owner === userId || p.owner?._id === userId
      );
      setStats({
        totalProjects: projects.length,
        ownedProjects: owned.length,
        collaborations: projects.length - owned.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (field) => {
    setEditField(field);
    setEditValue(userData[field]);
    setFieldError("");
    setFieldSuccess("");
  };

  const cancelEdit = () => {
    setEditField(null);
    setEditValue("");
    setFieldError("");
  };

  const saveField = async (field) => {
    if (!editValue.trim()) {
      setFieldError("This field cannot be empty.");
      return;
    }
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValue)) {
      setFieldError("Please enter a valid email.");
      return;
    }
    setSavingField(true);
    setFieldError("");
    try {
      await api.put(`/users/${userId}`, { [field]: editValue.trim() });
      const updated = { ...userData, [field]: editValue.trim() };
      setUserData(updated);
      if (field === "username") localStorage.setItem("userName", editValue.trim());
      if (field === "email") localStorage.setItem("userEmail", editValue.trim());
      setEditField(null);
      setFieldSuccess(`${field === "username" ? "Name" : "Email"} updated successfully!`);
      setTimeout(() => setFieldSuccess(""), 3000);
    } catch (err) {
      setFieldError(err?.response?.data?.message || "Failed to update. Try again.");
    } finally {
      setSavingField(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put(`/users/${userId}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      setPasswordError(
        err?.response?.data?.message || "Failed to change password. Check your current password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account and ALL your projects? This cannot be undone.")) return;
    if (!window.confirm("Last warning — this is IRREVERSIBLE. Click OK to confirm.")) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/users/${userId}`);
      ["authToken", "userId", "userEmail", "userName"].forEach((k) =>
        localStorage.removeItem(k)
      );
      navigate("/");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const userInitial = userData.username?.charAt(0).toUpperCase() || "U";

  return (
    <div className="profile-page">
      <div className="profile-bg-orb orb-1" />
      <div className="profile-bg-orb orb-2" />

      <div className="profile-container">
        {/* Back button */}
        <button className="profile-back-btn" onClick={() => navigate("/dashboard")}>
          <MdArrowBack size={18} />
          <span>Back to Dashboard</span>
        </button>

        {/* Hero card */}
        <div className="profile-hero-card">
          <div className="profile-hero-bg" />
          <div className="profile-hero-content">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-ring">
                <div className="profile-avatar-large">{userInitial}</div>
              </div>
            </div>
            <div className="profile-hero-info">
              <h1 className="profile-hero-name">{userData.username}</h1>
              <p className="profile-hero-email">{userData.email}</p>
              <span className="profile-hero-badge">Free Plan</span>
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.totalProjects}</span>
              <span className="profile-stat-label">Total Projects</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.ownedProjects}</span>
              <span className="profile-stat-label">My Projects</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.collaborations}</span>
              <span className="profile-stat-label">Collaborations</span>
            </div>
          </div>
        </div>

        {/* Global field success */}
        {fieldSuccess && (
          <div className="profile-alert success">
            <MdCheck size={16} />
            {fieldSuccess}
          </div>
        )}

        <div className="profile-grid">
          {/* Account Info */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon">
                <MdPerson size={18} />
              </div>
              <h2>Account Info</h2>
            </div>

            <div className="profile-fields">
              {/* Username */}
              <div className="profile-field">
                <label className="profile-field-label">Display Name</label>
                {editField === "username" ? (
                  <div className="profile-field-edit">
                    <input
                      ref={inputRef}
                      className="profile-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveField("username");
                        if (e.key === "Escape") cancelEdit();
                      }}
                      disabled={savingField}
                    />
                    <div className="profile-edit-actions">
                      <button
                        className="profile-action-btn save"
                        onClick={() => saveField("username")}
                        disabled={savingField}
                      >
                        {savingField ? <span className="profile-spinner" /> : <MdCheck size={16} />}
                      </button>
                      <button className="profile-action-btn cancel" onClick={cancelEdit}>
                        <MdClose size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-field-view">
                    <span className="profile-field-value">{userData.username}</span>
                    <button className="profile-edit-btn" onClick={() => startEdit("username")}>
                      <MdEdit size={15} /> Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="profile-field">
                <label className="profile-field-label">Email Address</label>
                {editField === "email" ? (
                  <div className="profile-field-edit">
                    <input
                      ref={inputRef}
                      className="profile-input"
                      type="email"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveField("email");
                        if (e.key === "Escape") cancelEdit();
                      }}
                      disabled={savingField}
                    />
                    <div className="profile-edit-actions">
                      <button
                        className="profile-action-btn save"
                        onClick={() => saveField("email")}
                        disabled={savingField}
                      >
                        {savingField ? <span className="profile-spinner" /> : <MdCheck size={16} />}
                      </button>
                      <button className="profile-action-btn cancel" onClick={cancelEdit}>
                        <MdClose size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-field-view">
                    <span className="profile-field-value">{userData.email}</span>
                    <button className="profile-edit-btn" onClick={() => startEdit("email")}>
                      <MdEdit size={15} /> Edit
                    </button>
                  </div>
                )}
              </div>

              {fieldError && editField && (
                <div className="profile-alert error">
                  <MdClose size={15} />
                  {fieldError}
                </div>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon">
                <MdLock size={18} />
              </div>
              <h2>Change Password</h2>
            </div>

            <form className="profile-password-form" onSubmit={handlePasswordChange} noValidate>
              {[
                { key: "currentPassword", label: "Current Password", show: "current" },
                { key: "newPassword", label: "New Password", show: "new" },
                { key: "confirmPassword", label: "Confirm New Password", show: "confirm" },
              ].map(({ key, label, show }) => (
                <div className="profile-field" key={key}>
                  <label className="profile-field-label">{label}</label>
                  <div className="profile-password-row">
                    <input
                      className="profile-input"
                      type={showPasswords[show] ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordData[key]}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      disabled={passwordLoading}
                      autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      className="profile-show-pass"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, [show]: !prev[show] }))
                      }
                    >
                      {showPasswords[show] ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                    </button>
                  </div>
                </div>
              ))}

              {passwordError && (
                <div className="profile-alert error">
                  <MdClose size={15} /> {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="profile-alert success">
                  <MdCheck size={15} /> {passwordSuccess}
                </div>
              )}

              <button className="profile-save-btn" type="submit" disabled={passwordLoading}>
                {passwordLoading ? (
                  <><span className="profile-spinner white" /> Updating…</>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="profile-card danger-card">
          <div className="profile-card-header">
            <div className="profile-card-icon danger-icon">
              <MdClose size={18} />
            </div>
            <h2>Danger Zone</h2>
          </div>
          <div className="danger-content">
            <div className="danger-info">
              <p className="danger-title">Delete Account</p>
              <p className="danger-desc">
                Permanently delete your account and all your projects. This action cannot be undone.
              </p>
            </div>
            <button
              className="danger-btn"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting…" : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
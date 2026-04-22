import "./dashboard.css";
import { LeftSidebar } from "./leftSidebar/leftSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { ProjectsContext } from "./ProjectsContext";
import { CgProfile } from "react-icons/cg";
import { CiSettings, CiLogout } from "react-icons/ci";
import { MdArrowDropDown } from "react-icons/md";
import { NotificationBell } from "../notificationBell/NotificationBell";

export const Dashboard = () => {
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const refreshProjects = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const resp = await api.get(`/project/user/${userId}`);
      setProjects(resp.data);
      return resp.data;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setUserDropdownOpen(false);
    navigate("/");
  };

  const userInitial = userName?.charAt(0).toUpperCase() || "U";

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <button className="logo-btn" onClick={() => navigate("/")}>
            <h1>SDE</h1>
          </button>
        </div>

        <div className="header-center">
          <input
            type="text"
            className="search-input"
            placeholder="Search documents, collaborators, activities..."
            aria-label="Search documents"
          />
        </div>

        <div className="header-right">
          <NotificationBell />

          <div className="user-section" ref={userDropdownRef}>
            <button
              className="user-button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-expanded={userDropdownOpen}
              aria-label="User menu"
            >
              <div className="user-avatar">{userInitial}</div>
              <div className="user-text">
                <span className="user-name">{userName}</span>
                <span className="user-email">{userEmail}</span>
              </div>
              <MdArrowDropDown className={`dropdown-arrow ${userDropdownOpen ? "open" : ""}`} />
            </button>

            {userDropdownOpen && (
              <nav className="user-dropdown" role="menu">
                <button
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => { setUserDropdownOpen(false); navigate("/profile"); }}
                >
                  <CgProfile size={18} />
                  <span>Profile</span>
                </button>
                <button className="dropdown-item" role="menuitem">
                  <CiSettings size={18} />
                  <span>Settings</span>
                </button>
                <button onClick={handleLogout} className="dropdown-item logout" role="menuitem">
                  <CiLogout size={18} />
                  <span>Logout</span>
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <LeftSidebar favProjects={projects.slice(0, 3)} />
        <ProjectsContext.Provider value={{ projects, refreshProjects }}>
          <Outlet />
        </ProjectsContext.Provider>
      </div>
    </div>
  );
};
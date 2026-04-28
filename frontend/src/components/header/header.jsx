import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./header.css";
import { isLoggedIn } from "../../utils/auth";
import { CgProfile } from "react-icons/cg";
import { BiSolidDashboard } from "react-icons/bi";
import { CiLogout, CiSettings } from "react-icons/ci";
import { MdArrowDropDown } from "react-icons/md";

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const hiddenRoutes = [
    "/login",
    "/register",
    "/dashboard",
    "/dashboard/create",
    "/dashboard/details",
    "/editor",
    "/shared",
  ];


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setDropdownOpen(false);
    window.location.href = "/"
  };
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const userName = localStorage.getItem("userName");
  const userInitial = userName?.charAt(0).toUpperCase() || "U";

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/dashboard" className="logo">
          <h1>Shared Doucument Editor</h1>
        </Link>

        {isLoggedIn() ? (
          <div className="profile-section" ref={dropdownRef}>
            <button
              className="profile-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-label="User menu"
            >
              <div className="profile-avatar">{userInitial}</div>
              <span className="profile-name">{userName}</span>
              <MdArrowDropDown className={`dropdown-icon ${dropdownOpen ? 'open' : ''}`} />
            </button>

            {dropdownOpen && (
              <nav className="dropdown-menu" role="menu">
                <Link to="/profile" className="dropdown-item" role="menuitem">
                  <CgProfile size={18} />
                  <span>Profile</span>
                </Link>
                <Link to="/dashboard" className="dropdown-item" role="menuitem">
                  <BiSolidDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/settings" className="dropdown-item" role="menuitem">
                  <CiSettings size={18} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="dropdown-item logout"
                  role="menuitem"
                >
                  <CiLogout size={18} />
                  <span>Logout</span>
                </button>
              </nav>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="auth-btn ghost">Sign In</Link>
            <Link to="/register" className="auth-btn primary">Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
};

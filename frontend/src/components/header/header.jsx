import { Link, useLocation } from "react-router-dom";

import "./header.css";
import { isLoggedIn } from "../../utils/auth";
import { CgProfile } from "react-icons/cg";
import { BiSolidDashboard } from "react-icons/bi";
import { CiLogout, CiSettings } from "react-icons/ci";
import { MdArrowDropDown } from "react-icons/md";
export const Header = () => {
  const location = useLocation();

  const hiddenRoutes = [
    "/login",
    "/register",
    "/dashboard",
    "/dashboard/create",
    "/dashboard/details",
    "/editor",
  ];

  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }
  const toggleDropMenu = () => {
    const dropMenu = document.querySelector(".drop-menu");
    dropMenu.classList.toggle("active");
  };
  const userName = localStorage.getItem("userName");
  return (
    <header>
      <div className="logo">
        <h1>S D E</h1>
      </div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#getStart">Get Started</a>
          </li>
        </ul>
      </nav>
      {isLoggedIn() ? (
        <div className="profile">
          <div className="profile-img">
            <img
              src="https://www.w3schools.com/howto/img_avatar.png"
              alt="Profile"
            />
          </div>
          <span className="profile-name">{userName}</span>
          <button className="drop-menu-button" onClick={toggleDropMenu}>
            <MdArrowDropDown />
          </button>
          <div className="drop-menu">
            <ul>
              <li>
                <CgProfile />
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <BiSolidDashboard />
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <CiSettings />
                <Link to="/settings">Settings</Link>
              </li>
              <li>
                <CiLogout />
                <Link to="/logout">Logout</Link>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="auth-buttons">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </header>
  );
};

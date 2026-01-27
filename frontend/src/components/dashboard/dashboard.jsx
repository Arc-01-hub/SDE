import {
  IoIosCloseCircleOutline,
  IoIosNotificationsOutline,
} from "react-icons/io";
import "./dashboard.css";
import { LeftSidebar } from "./leftSidebar/leftSidebar";
import { MainContent } from "./mainContent/mainContent";
import { RightSidebar } from "./rightSidebar/rightSidebar";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { createContext, useEffect, useState } from "react";
import api from "../api/api";

export const ProjectsContext = createContext();

export const Dashboard = () => {
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");

  const navigate = useNavigate();
  const closeModal = () => {
    // navigate("/dashboard");
  };

  const userId = localStorage.getItem("userId");
  const [projects, setProjects] = useState([]);
  const getProjects = () => {
    userId &&
      api
        .get(`/project/user/${userId}`)
        .then((resp) => setProjects(resp.data))
        .catch((err) => console.log(err));
  };

  useEffect(() => {
    if (userId) {
      getProjects();
    }
  }, [userId]);
  return (
    <div className="dashboard-container">
      <div className="header-section">
        <div className="dashboard-title">
          <h1>S.D.E</h1>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search documents,collaborators,activities and more..."
          />
        </div>
        <div className="user-info">
          <div className="notification">
            <IoIosNotificationsOutline />
          </div>
          <div className="user-name">
            <span className="name">{userName}</span>
            <span className="email">{userEmail}</span>
          </div>
        </div>
      </div>
      <div className="content-section">
        <LeftSidebar />
        {/* <RightSidebar /> */}
        <Outlet />
      </div>
      {/* <ProjectsContext.Provider value={{ getProjects }}>
        <div className="modal-box">
          <div className="modal-content">
            <button className="modal-cancel" onClick={closeModal}>
              <IoIosCloseCircleOutline />
            </button>
            
          </div>
        </div>
      </ProjectsContext.Provider> */}
    </div>
  );
};

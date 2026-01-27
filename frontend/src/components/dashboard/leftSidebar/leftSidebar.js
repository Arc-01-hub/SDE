import { Link } from "react-router-dom";
import "./leftSidebar.css";
import { CiLogout } from "react-icons/ci";
import { SlDocs } from "react-icons/sl";
import { RiFolderReceivedLine } from "react-icons/ri";
import { MdOutlineRecentActors } from "react-icons/md";
import { IoTrashBinOutline } from "react-icons/io5";
import { FaRegStar } from "react-icons/fa";
import { GoProjectRoadmap } from "react-icons/go";
export const LeftSidebar = () => {
  return (
    <div className="left-sidebar">
      <div className="sidebar-links">
        <Link to="/dashboard/projects">
          <SlDocs />
          My Projects
        </Link>
        <Link to="/shared">
          <RiFolderReceivedLine />
          Shared with me
        </Link>
        <Link to="/recent">
          <MdOutlineRecentActors />
          Recent
        </Link>
        <Link to="/trash">
          <IoTrashBinOutline />
          Trash
        </Link>
      </div>
      <div className="favorite-section">
        <h3>
          {" "}
          <FaRegStar />
          Favorites
        </h3>
        <div className="favorite-items">
          <Link to="/favorites/project1">
            <GoProjectRoadmap />
            Project 1
          </Link>
          <Link to="/favorites/project2">
            <GoProjectRoadmap />
            Project 2
          </Link>
          <Link to="/favorites/project3">
            <GoProjectRoadmap />
            Project 3
          </Link>
        </div>
      </div>
      <div className="current-plan">
        <h3>Current Plan</h3>
        <p>Free Plan</p>
        <Link to="/upgrade" className="upgrade-link">
          Upgrade Plan
        </Link>
      </div>
      <div className="logout-section">
        <button className="logout-button">
          <CiLogout />
          Logout
        </button>
      </div>
    </div>
  );
};

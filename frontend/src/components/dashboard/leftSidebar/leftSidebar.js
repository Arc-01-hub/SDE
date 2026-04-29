import { Link } from "react-router-dom";
import "./leftSidebar.css";
import { SlDocs } from "react-icons/sl";
import { RiFolderReceivedLine } from "react-icons/ri";
import { MdOutlineRecentActors } from "react-icons/md";
import { IoTrashBinOutline } from "react-icons/io5";
import { FaRegStar } from "react-icons/fa";
import { GoProjectRoadmap } from "react-icons/go";

export const LeftSidebar = ({ favProjects, isOpen, onClose }) => {
  return (
    <div className={`left-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-links">
        <Link to="/dashboard" onClick={onClose}>
          <SlDocs />
          My Projects
        </Link>
        <Link to="/shared" onClick={onClose}>
          <RiFolderReceivedLine />
          Shared with me
        </Link>
        <Link to="/dashboard/recent" onClick={onClose}>  {/* ✅ fixed */}
          <MdOutlineRecentActors />
          Recent
        </Link>
        <Link to="/dashboard/trash" onClick={onClose}>   {/* ✅ fixed */}
          <IoTrashBinOutline />
          Trash
        </Link>
      </div>

      <div className="favorite-section">
        <h3>
          <FaRegStar />
          Favorites
        </h3>
        <div className="favorite-items">
          {favProjects.map((project) => (   // ✅ fixed [favProjects.map]
            <Link
              key={project._id}
              to={`/dashboard/details/${project._id}`}
              state={{ project }}
              onClick={onClose}
            >
              <GoProjectRoadmap />
              {project.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="current-plan">
        <h3>Current Plan</h3>
        <p>Free Plan</p>
        <Link to="/upgrade" className="upgrade-link">
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
};
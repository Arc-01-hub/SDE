import { Route, Routes } from "react-router-dom";
import "./App.css";
import { Header } from "./components/header/header";
import { Home } from "./components/home/home";
import { Register } from "./components/auth/register/register";
import { Login } from "./components/auth/login/login";
import { Dashboard } from "./components/dashboard/dashboard";
import { Editor } from "./components/editor/editor";
import { Profile } from "./components/profile/profile";
import { CreateProject } from "./components/dashboard/createProject/createProject";
import { ProjectDetails } from "./components/dashboard/projectDetails/projectDetails";
import { MainContent } from "./components/dashboard/mainContent/mainContent";
import { Trash } from "./components/dashboard/trash/Trash";
import { Recent } from "./components/dashboard/recent/Recent";
import { useEffect, useState } from "react";
import api from "../src/components/api/api";
import './styles/variables.css';
import ProtectedRoute from "./components/protectedRoute/protectedRoute";

function App() {
  const [projects, setProjects] = useState([]);

  const getProjects = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    api
        .get(`/project/user/${userId}`)
        .then((resp) => setProjects(resp.data))
        .catch((err) => console.log(err));
  };

  useEffect(() => {
    getProjects();
    window.addEventListener("storage", getProjects);
    return () => window.removeEventListener("storage", getProjects);
  }, []);

  return (
      <>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<div>Contact Page</div>} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          >
            <Route index element={<MainContent projects={projects} />} />
            <Route path="create" element={<CreateProject />} />
            <Route path="details/:id" element={<ProjectDetails />} />
          </Route>
          <Route path="/editor" element={<Editor />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/trash" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
          <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />
        </Routes>
      </>
  );
}

export default App;
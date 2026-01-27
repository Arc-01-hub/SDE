import { Route, Routes } from "react-router-dom";
import "./App.css";
import { Header } from "./components/header/header";
import { Home } from "./components/home/home";
import { Register } from "./components/auth/register/register";
import { Login } from "./components/auth/login/login";
import { Dashboard } from "./components/dashboard/dashboard";
import { Editor } from "./components/editor/editor";
import { CreateProject } from "./components/dashboard/createProject/createProject";
import { ProjectDetails } from "./components/dashboard/projectDetails/projectDetails";
import { MainContent } from "./components/dashboard/mainContent/mainContent";
import { useEffect, useState } from "react";
import api from "../src/components/api/api";
function App() {

  const [projects, setProjects] = useState([]);
  const userId = localStorage.getItem("userId");
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
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<div>Contact Page</div>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="projects" element={<MainContent projects={projects} />} />
          <Route path="create" element={<CreateProject />} />
          <Route path="details/:id" element={<ProjectDetails />} />
        </Route>
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </>
  );
}

export default App;

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
import './styles/variables.css';
import {jwtDecode} from "jwt-decode";
import logout from "./components/auth/logout/logout";
import ProtectedRoute from "./components/protectedRoute/protectedRoute";

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


  const isTokenExpired = (token) => {
    try {
      const { exp } = jwtDecode(token);
      console.log(exp);
      return Date.now() >= exp * 1000;
    } catch (error) {
      return true;
    }
  }


  // useEffect(() => {
  //   const token = localStorage.getItem("authToken");
  //   if(token){
  //     if (isTokenExpired(token)) {
  //     logout();
  //     console.log("Token is expired");
  //   }
  //   }
  // }, []);
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<div>Contact Page</div>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<MainContent projects={projects} />} />
          <Route path="create" element={<CreateProject />} />
          <Route path="details/:id" element={<ProjectDetails />} />
        </Route>
        <Route path="/editor" element={<Editor />} />
        <Route path="/profile" element={<Profile/>} />
      </Routes>
    </>
  );
}

export default App;

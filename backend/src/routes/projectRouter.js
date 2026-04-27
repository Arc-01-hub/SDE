const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjectsForUser,
  updateProject,
  addCollaborator,
  getOneProjectById,
  deleteProject,
  getTrashedProjects,
  restoreProject,
  permanentDeleteProject,
} = require("../controllers/projectController");

router.post("/create", createProject);
router.put("/update/:id", updateProject);
router.get("/user/:id", getProjectsForUser);
router.get("/trash/:userId", getTrashedProjects);
router.put("/restore/:id", restoreProject);
router.delete("/permanent/:id", permanentDeleteProject);
router.get("/:id", getOneProjectById);
router.delete("/:id", deleteProject);
router.post("/add-collaborator/:id", addCollaborator);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjectsForUser,
  updateProject,
  addCollaborator,
  getOneProjectById,
  deleteProject,
} = require("../controllers/projectController");
const { route } = require("./authRouter");

router.post("/create", createProject);
router.put("/update/:id", updateProject);
router.get("/user/:id", getProjectsForUser);
router.get("/:id",getOneProjectById);
router.delete("/:id", deleteProject);
router.post("/add-collaborator/:id", addCollaborator);

module.exports = router;

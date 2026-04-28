const Project = require("../models/project");
const User = require("../models/user");
const { logActivity } = require("./activityController");

const createProject = async (req, res) => {
  const { title, tags, userId, desc } = req.body;
  try {
    const project = new Project({ title, tags, owner: userId, desc });
    await project.save();
    await logActivity({
      projectId: project._id,
      userId,
      action: "project_created",
      metadata: { title },
    });
    res.status(201).json({ message: "Project created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getProjectsForUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const projects = await Project.find({
      $or: [{ owner: userId }, { collaborators: userId }],
      isDeleted: { $ne: true },
    })
      .populate("owner", "username")
      .populate("collaborators", "username")
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOneProjectById = async (req, res) => {
  const projectId = req.params.id;
  try {
    const project = await Project.findById(projectId)
      .populate("owner", "username")
      .populate("collaborators", "username");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProject = async (req, res) => {
  const projectId = req.params.id;
  const { title, content, tags, collaborators, userId } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const oldTitle = project.title;
    project.title = title;
    project.content = content;
    project.tags = tags;
    project.collaborators = collaborators;
    await project.save();
    await logActivity({
      projectId,
      userId: userId || project.owner,
      action: "project_updated",
      metadata: {
        titleChanged: oldTitle !== title,
        oldTitle: oldTitle !== title ? oldTitle : undefined,
        newTitle: oldTitle !== title ? title : undefined,
      },
    });
    res.json({ message: "Project updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Soft delete - moves to trash
const deleteProject = async (req, res) => {
  const projectId = req.params.id;
  const userId = req.query.userId || req.body?.userId;
  try {
    const project = await Project.findByIdAndUpdate(
      projectId,
      { isDeleted: true },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    await logActivity({
      projectId,
      userId: userId || project.owner,
      action: "project_deleted",
      metadata: { title: project.title },
    });
    res.json({ message: "Project moved to trash" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get trashed projects
const getTrashedProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await Project.find({ owner: userId, isDeleted: true })
      .populate("owner", "username email")
      .populate("collaborators", "username email")
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Restore from trash
const restoreProject = async (req, res) => {
  const userId = req.query.userId || req.body?.userId;
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    await logActivity({
      projectId: project._id,
      userId: userId || project.owner,
      action: "project_restored",
      metadata: { title: project.title },
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Permanent delete
const permanentDeleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addCollaborator = async (req, res) => {
  const projectId = req.params.id;
  const { email, userId } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (project.collaborators.includes(user._id)) {
      return res.status(400).json({ message: "User is already a collaborator" });
    }
    project.collaborators.push(user);
    await project.save();
    await logActivity({
      projectId,
      userId: userId || project.owner,
      action: "collaborator_added",
      metadata: { collaboratorEmail: email, collaboratorName: user.username },
    });
    res.json({ message: "Collaborator added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW: Leave project as collaborator
const leaveProject = async (req, res) => {
  const projectId = req.params.id;
  const { userId } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: "Owner cannot leave. Delete the project instead." });
    }
    project.collaborators = project.collaborators.filter(
      (c) => c.toString() !== userId
    );
    await project.save();
    res.json({ message: "Left project successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProject,
  getProjectsForUser,
  getOneProjectById,
  updateProject,
  addCollaborator,
  deleteProject,
  getTrashedProjects,
  restoreProject,
  permanentDeleteProject,
  leaveProject,
};
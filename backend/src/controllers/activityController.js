const Activity = require("../models/activity");

// Log a new activity (used internally by other controllers)
const logActivity = async ({ projectId, userId, action, metadata = {} }) => {
  try {
    await Activity.create({
      project: projectId,
      user: userId,
      action,
      metadata,
    });
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};

// Get activities for a project (owner sees all, collaborators see updates only)
const getProjectActivities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.query;

    const Project = require("../models/project");
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isOwner = project.owner.toString() === userId;

    const filter = { project: projectId };
    if (!isOwner) {
      filter.action = { $in: ["project_updated", "collaborator_added"] };
    }

    const activities = await Activity.find(filter)
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all recent activities across all user's projects
const getRecentActivities = async (req, res) => {
  try {
    const { userId } = req.params;

    const Project = require("../models/project");
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { collaborators: userId }],
    }).select("_id");

    const projectIds = userProjects.map((p) => p._id);

    const activities = await Activity.find({ project: { $in: projectIds } })
      .populate("user", "username")
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { logActivity, getProjectActivities, getRecentActivities };

const Project = require("../models/project");
const User = require("../models/user");

const createProject = async (req, res) => {
  const { title, tags, userId,desc } = req.body;
  try {
    project = new Project({
      title: title,
      tags: tags,
      owner: userId,
      desc: desc,
    });
    await project.save();
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
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const updateProject = async (req, res) => {
  const projectId = req.params.id;
  const { title, content, tags, collaborators } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    project.title = title;
    project.content = content;
    project.tags = tags;
    project.collaborators = collaborators;
    await project.save();
    res.json({ message: "Project updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProject = async(req, resp)=>{
  const projectId = req.params.id;
  try{
    const project = await Project.findById(projectId);
     if (!project) {
      return res.status(404).json({ message: "Project not found" });
    } else {
      project.isDeleted = true;
      await project.save();
      res.json({ message: "Project deleted successfully" });
    }

  }catch(error){
  res.status(500).json({ message: err.message });
  }
}
// ------------------------------------------

const addCollaborator = async (req, res) => {
  const projectId = req.params.id;
  const { email } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    } else {
      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (project.collaborators.includes(user._id)) {
        return res
          .status(400)
          .json({ message: "User is already a collaborator" });
      }
      project.collaborators.push(user);
      await project.save();
      res.json({ message: "Collaborator added successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createProject, getProjectsForUser, getOneProjectById, updateProject, addCollaborator,deleteProject };
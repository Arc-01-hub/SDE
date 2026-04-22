const Invitation = require("../models/invitation");
const User = require("../models/user");
const Project = require("../models/project");

// POST /api/invitations/send — send invite
const sendInvitation = async (req, res) => {
  try {
    const { projectId, recipientEmail } = req.body;
    const senderId = req.body.senderId;

    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ message: "User not found with that email." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if already a collaborator
    if (project.collaborators.includes(recipient._id)) {
      return res.status(400).json({ message: "User is already a collaborator." });
    }

    // Check if owner
    if (project.owner.toString() === recipient._id.toString()) {
      return res.status(400).json({ message: "User is the project owner." });
    }

    // Check if already invited
    const existing = await Invitation.findOne({
      project: projectId,
      recipient: recipient._id,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "Invitation already sent." });
    }

    const invitation = new Invitation({
      project: projectId,
      sender: senderId,
      recipient: recipient._id,
    });
    await invitation.save();

    res.status(201).json({ message: "Invitation sent successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/:userId — get pending invitations for a user
const getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      recipient: req.params.userId,
      status: "pending",
    })
      .populate("project", "title")
      .populate("sender", "username email");

    res.json(invitations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/invitations/:id/accept — accept invite
const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ message: "Invitation not found." });

    invitation.status = "accepted";
    await invitation.save();

    // Add to collaborators
    await Project.findByIdAndUpdate(invitation.project, {
      $addToSet: { collaborators: invitation.recipient },
    });

    res.json({ message: "Invitation accepted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/invitations/:id/decline — decline invite
const declineInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ message: "Invitation not found." });

    invitation.status = "declined";
    await invitation.save();

    res.json({ message: "Invitation declined." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendInvitation, getInvitations, acceptInvitation, declineInvitation };

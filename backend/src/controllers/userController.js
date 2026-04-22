const User = require("../models/user");
const bcrypt = require("bcryptjs");

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all emails
const getEmails = async (req, res) => {
  try {
    const users = await User.find().select("email -_id");
    const emails = users.map((user) => user.email);
    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id — update username or email
const updateUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateData = {};

    if (username) updateData.username = username.trim();
    if (email) {
      const existing = await User.findOne({ email: email.trim() });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Email already in use." });
      }
      updateData.email = email.trim();
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "User not found." });

    res.json({ message: "Profile updated successfully.", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id/password — change password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id — delete account + owned projects
const deleteUser = async (req, res) => {
  try {
    const Project = require("../models/project");

    await Project.deleteMany({ owner: req.params.id });
    await Project.updateMany(
      { collaborators: req.params.id },
      { $pull: { collaborators: req.params.id } }
    );

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found." });

    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, getEmails, updateUser, updatePassword, deleteUser };
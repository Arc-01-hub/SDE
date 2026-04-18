const User = require("../models/user");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getEmails = async (req, res) => {
  try {
    const users = await User.find().select("email -_id");
    const emails = users.map((user) => user.email);
    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, getEmails };
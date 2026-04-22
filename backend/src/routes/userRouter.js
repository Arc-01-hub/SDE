const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getEmails,
  updateUser,
  updatePassword,
  deleteUser,
} = require("../controllers/userController");

router.get("/", getAllUsers);
router.get("/emails", getEmails);
router.put("/:id", updateUser);
router.put("/:id/password", updatePassword);
router.delete("/:id", deleteUser);

module.exports = router;
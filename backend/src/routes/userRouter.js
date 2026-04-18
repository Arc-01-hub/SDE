const express = require("express");
const router = express.Router();
const { getAllUsers, getEmails } = require("../controllers/userController");

router.get("/", getAllUsers);
router.get("/emails", getEmails);
module.exports = router;
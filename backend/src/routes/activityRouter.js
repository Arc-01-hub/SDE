const express = require("express");
const router = express.Router();
const { getProjectActivities, getRecentActivities } = require("../controllers/activityController");

router.get("/project/:projectId", getProjectActivities);
router.get("/recent/:userId", getRecentActivities);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  sendInvitation,
  getInvitations,
  acceptInvitation,
  declineInvitation,
} = require("../controllers/invitationController");

router.post("/send", sendInvitation);
router.get("/:userId", getInvitations);
router.put("/:id/accept", acceptInvitation);
router.put("/:id/decline", declineInvitation);

module.exports = router;

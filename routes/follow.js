const express = require("express");
const FollowController = require("../controllers/follow")

const router = express.Router()

router.get("/follow-test", FollowController.followTest)

module.exports = router

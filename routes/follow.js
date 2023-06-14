const express = require("express");

const check = require('../middlewares/auth');
const FollowController = require("../controllers/follow")

const router = express.Router()

router.post('/save', check.auth, FollowController.follow);
router.delete('/unfollow/:id/', check.auth, FollowController.unfollow);
router.get('/following/:id?/:page?', check.auth, FollowController.following);
router.get('/followers/:id?/:page?', check.auth, FollowController.followers);

module.exports = router

const Follow = require('../models/Follow');

const followUserIds = async (identityUserId) => {
  try {
    let following = await Follow.find({ user: identityUserId }).select({
      followed: 1,
      _id: 0,
    });
    let followers = await Follow.find({ followed: identityUserId }).select({
      user: 1,
      _id: 0,
    });

    let followingClean = [];

    following.forEach((f) => {
      followingClean.push(f.followed);
    });
    let followersClean = [];

    followers.forEach((f) => {
      followersClean.push(f.user);
    });

    return {
      followers: followersClean,
      following: followingClean,
    };
  } catch (error) {
    return error;
  }
};

const followThisUser = async (identityUserId, profileUserId) => {
  const following = await Follow.findOne({ "user": identityUserId, "followed": profileUserId })
  
  const follower = await Follow.findOne({ "user": profileUserId, "followed": identityUserId })

  return {
    following,
    follower
  }

};

module.exports = {
  followUserIds,
  followThisUser,
};

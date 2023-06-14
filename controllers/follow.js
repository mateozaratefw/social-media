const mongoosePaginate = require('mongoose-pagination');

const followService = require('../services/follow.service');
const Follow = require('../models/Follow');
const User = require('../models/User');

const follow = (req, res) => {
  const params = req.body;
  const identity = req.user;

  let userToFollow = new Follow({
    user: identity.id,
    followed: params.followed,
  });

  userToFollow
    .save()
    .then((followStored) => {
      if (!followStored) {
        return res.status(500).send({
          status: 'error',
          message: 'No se ha podido seguir al user',
        });
      } else {
        return res.status(200).send({
          status: 'success',
          follow: followStored,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send({
        status: 'error',
        message: 'No se ha podido seguir al user',
      });
    });
};

const unfollow = (req, res) => {
  const userId = req.user.id;
  const followedId = req.params.id;

  Follow.deleteOne({
    user: userId,
    followed: followedId,
  })
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(500).json({
          status: 'error',
          message: 'No se ha podido dejar de seguir al usuario',
        });
      } else {
        return res.status(200).json({
          status: 'success',
          message: 'Dejaste de seguir al usuario',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        status: 'error',
        message: 'Error en el servidor al dejar de seguir al usuario',
      });
    });
};

const following = (req, res) => {
  let userId = req.params.id;
  console.log('rew params id ' + userId);
  if (!req.params.id) userId = req.user.id;
  console.log('auth id ' + req.user.id);

  let page = 1;
  if (req.params.page) page = req.params.page;

  const itemsPerPage = 5;

  Follow.find({ user: userId })
    .populate('user followed', '-password -role -__v -created_at')
    .paginate(page, itemsPerPage)
    .then(async (follows, total) => {
      console.log('identity user id controller ' + req.user.id);
      const followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).json({
        status: 'success',
        follows,
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        status: 'error',
        message: 'Error en la consulta',
      });
    });
};

const followers = (req, res) => {
  let userId = req.params.id;
  console.log('rew params id ' + userId);
  if (!req.params.id) userId = req.user.id;
  console.log('auth id ' + req.user.id);

  let page = 1;
  if (req.params.page) page = req.params.page;

  const itemsPerPage = 5;

  Follow.find({ followed: userId })
    .populate('user', '-password -role -__v -created_at')
    .paginate(page, itemsPerPage)
    .then(async (follows, total) => {
      console.log('identity user id controller ' + req.user.id);
      const followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).json({
        status: 'success',
        message: "Listado de seguidores",
        follows,
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        status: 'error',
        message: 'Error en la consulta',
      });
    });
};

module.exports = {
  follow,
  unfollow,
  following,
  followers,
};

const bcrypt = require('bcrypt');
const fs = require("fs");
const mongoosePagination = require('mongoose-pagination');
const path = require("path");

const User = require('../models/User');
const jwt = require('../services/jwt');

const test = (req, res) => {
  return res.send({
    data: 'llegue',
    muerte: req.user,
  });
};

const register = (req, res) => {
  const params = req.body;

  if (!params.name || !params.nick || !params.password || !params.email) {
    console.log('VALIDACION INCORRECTA');
    res.status(400).json({
      status: 'error',
      message: 'Faltan datos por enviar',
    });
  }

  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  })
    .then((user) => {
      if (user && user.length >= 1) {
        res.status(200).send({
          status: 'success',
          message: 'El usuario ya existe',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        status: 'error',
        message: 'error en la consulta',
      });
    });

  console.log(`pre hash ${params.password}`);

  bcrypt.hash(params.password, 10).then((password) => {
    params.password = password;
    const user_to_save = new User(params);

    user_to_save
      .save()
      .then((userStored) => {
        res.status(200).send({
          message: 'Usuario guardado',
          user: userStored,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          status: 'error',
          message: 'error gay',
        });
      });
  });
};

const login = async (req, res) => {
  try {
    const params = req.body;

    if (!params.email || !params.password) {
      return res.status(400).json({
        status: 'error',
        message: 'Faltan datos por enviar',
      });
    }

    const user = await User.findOne({ email: params.email }).exec();

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No existe el usuario',
      });
    }

    const pwd = bcrypt.compareSync(params.password, user.password);

    if (!pwd) {
      return res.status(400).json({
        status: 'error',
        message: 'No te has identificado correctamente',
      });
    }

    const token = jwt.createToken(user);

    return res.status(200).json({
      status: 'success',
      message: 'Te has logueado correctamente',
      user: {
        id: user._id,
        name: user.name,
        nick: user.nick,
      },
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 'error',
      message: 'Error del lado del servidor',
    });
  }
};

const profile = (req, res) => {
  const id = req.params.id;

  User.findById(id)
    .select({ password: 0, role: 0 })
    .exec()
    .then((userProfile) => {
      if (!userProfile) {
        return res.status(404).send({
          message: 'El user no existe',
          status: 'error',
        });
      }

      return res.status(200).send({
        status: 'success',
        userProfile,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).send({
        message:
          'El user no existe (o tal vez tenes un error que no reconocemos)',
        status: 'error',
      });
    });

  // devolver resultado
};

const list = (req, res) => {
  // Controlar en que pagina estamos
  let page = 1;

  if (req.params.page) {
    page = req.params.page;
  }
  page = parseInt(page);

  let itemsPerPage = 5;

  User.find()
    .sort('_id')
    .paginate(page, itemsPerPage)
    .then((users, total) => {
      if (!users) {
        return res.status(404).send({
          message: 'No hay usuarios disponibles',
          status: 'error',
        });
      }
      return res.status(200).send({
        status: 'success',
        users,
        total,
        page,
        itemsPerPage,
        pages: Math.ceil(total / itemsPerPage),
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).send({
        message: 'Error en la consulta',
        status: 'error',
      });
    });
};

const update = async (req, res) => {
  try {
    const userIdentity = req.user;
    let userToUpdate = req.body;

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    const users = await User.find({
      $or: [
        { email: userToUpdate.email.toLowerCase() },
        { nick: userToUpdate.nick.toLowerCase() },
      ],
    });

    let userExists = false;

    users.forEach((user) => {
      if (user && user._id.toString() !== userIdentity.id.toString()) {
        userExists = true;
      }
    });

    if (userExists) {
      return res.status(200).json({
        status: 'error',
        message: 'El usuario ya existe',
      });
    }

    if (userToUpdate.password) {
      const pwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    }

    User.findByIdAndUpdate(userIdentity.id, userToUpdate, { new: true })
      .then((userUpdated) => {
        if (!userUpdated) {
          return res.status(500).json({
            status: 'error',
            message: 'Error al actualizar usuario',
          });
        }

        return res.status(200).json({
          status: 'success',
          message: 'Actualización exitosa',
          user: userUpdated,
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({
          status: 'error',
          message: 'Error en la consulta',
        });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 'error',
      message: 'Error en la consulta',
    });
  }
};

const upload = (req, res) => {
  if (!req.file) {
    return res.status(404).send({
      status: 'error',
      message: 'Peticion no incluye la imagen',
    });
  }

  const image = req.file.originalname;
  const imageSplit = image.split('\.');
  const extension = imageSplit[1]

  if (
    extension != 'png' &&
    extension != 'jpg' &&
    extension != 'jpeg' &&
    extension != 'gif'
  ) {
    const deletedFile = fs.unlinkSync(req.file.path);

    return res.status(200).json({
      status: 'error',
      message: 'No has subido el archivo correcto, extension invalida',
      file: deletedFile,
    });

  }

  User.findOneAndUpdate(
    { _id: req.user.id},
    { image: req.file.filename },
    { new: true },
  ).then(userUpdated => {
    if (!userUpdated) {
      return res.status(500).json({
        status: 'error',
        message: 'Error en la subida',
      });
    }
    return res.status(200).send({
      status: 'success',
      user: userUpdated,
      file: req.file,
    });
  }).catch(err => {
    console.log(err);
    return res.status(500).json({
      status: 'error',
      message: 'Error en la subida',
    });
  })

};

const avatar = (req, res) => {
  const file = req.params.file;

  const filePath = './uploads/avatars/' + file;
  
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).json({
        status: 'error',
        message: 'No existe la imagen',
      });
    }
    return res.sendFile(path.resolve(filePath));
  });

};

module.exports = {
  register,
  login,
  test,
  profile,
  list,
  update,
  upload,
  avatar,
};

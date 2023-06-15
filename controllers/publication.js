const fs = require('fs');
const path = require('path');

const paginate = require('mongoose-pagination');
const Publication = require('../models/Publication');
const followService = require('../services/follow.service');

const save = (req, res) => {
  const params = req.body;

  if (!params) {
    res.status(400).send({
      message: 'Debes enviar el contenido de la publicacion',
      status: 'error',
    });
  }

  let newPublication = new Publication(params);
  newPublication.user = req.user.id;

  newPublication
    .save()
    .then((savedPublication) => {
      return res.status(200).send({
        status: 'success',
        message: 'Publicacion guardad',
        publication: savedPublication,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        message: 'Mensaje invalido',
        status: 'error',
      });
    });
};

const detail = (req, res) => {
  const publicationId = req.params.id;

  Publication.findById(publicationId)
    .then((publication) => {
      if (!publication) {
        res.status(404).send({
          message: 'No hay publication que mostrar',
          status: 'error',
        });
      }
      return res.status(200).send({
        status: 'success',
        publication,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        message: 'Mensaje invalido',
        status: 'error',
      });
    });
};

const remove = (req, res) => {
  const publicationId = req.params.id;

  Publication.findByIdAndDelete({ user: req.user.id, _id: publicationId })
    .then((publication) => {
      if (!publication) {
        res.status(404).send({
          message: 'Esa publicacion no existe',
          status: 'error',
        });
      }
      return res.status(200).send({
        status: 'success',
        message: 'Publicacion eliminada',
        publication,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({
        message: 'No se ha eliminado la publicacion',
        status: 'error',
      });
    });
};

const user = (req, res) => {
  const userId = req.params.id;

  let page = 1;
  if (req.params.page) page = req.params.page;

  const itemsPerPage = 2;

  Publication.find({ user: userId })
    .sort('-created_at')
    .populate('user', '-password -__v -role')
    .paginate(page, itemsPerPage)
    .then((publication) => {
      if (!publication) {
        res.status(404).send({
          message: 'Esa publicacion no existe',
          status: 'error',
        });
      }
      return res.status(200).send({
        status: 'success',
        publication,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({
        message: 'No se ha eliminado la publicacion',
        status: 'error',
      });
    });
};

const upload = (req, res) => {
  const publicationId = req.params.id;

  if (!req.file) {
    return res.status(404).send({
      status: 'error',
      message: 'Peticion no incluye la imagen',
    });
  }

  const image = req.file.originalname;
  const imageSplit = image.split('.');
  const extension = imageSplit[1];

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

  Publication.findOneAndUpdate(
    { user: req.user.id, _id: publicationId },
    { file: req.file.filename },
    { new: true },
  )
    .then((publicationUpdated) => {
      if (!publicationUpdated) {
        return res.status(404).json({
          status: 'error',
          message: 'No sos vos, picaron',
        });
      }
      return res.status(200).send({
        status: 'success',
        publication: publicationUpdated,
        file: req.file,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        status: 'error',
        message: 'Error en la subida',
      });
    });
};

const media = (req, res) => {
  const file = req.params.file;

  const filePath = './uploads/publications/' + file;

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

const feed = async (req, res) => {
  // Sacar la pagina actual
  let page = 1;

  if (req.params.page) {
    page = req.params.page;
  }

  // Establecer numero de elementos por pagina
  let itemsPerPage = 5;

  // Sacar un array de ids de usuarios que yo sigo como usuario identificado
  try {
    const myFollows = await followService.followUserIds(req.user.id);
    // Find a publicaciones utilizando el operador $in, ordenar, popular, paginar

    const publications = await Publication.find({
      user: myFollows.following,
    })
      .populate('user', "-password -role -__v -email")
      .sort('-created_at');

    return res.status(200).json({
      status: 'success',
      message: 'Feed de publis',
      following: myFollows.following,
      publications,
    });
  } catch (error) {
    return res.status(404).json({
      status: 'error',
      message: 'No se han listado las publicaciones del feed',
    });
  }
};

module.exports = {
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};

const jwt = require("jwt-simple");
const moment = require("moment");

const libjwt = require("../services/jwt");
const secret = libjwt.secret;

exports.auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "No has mandado la auth"
    });
  }

  const token = req.headers.authorization.replace(/['"]+/g, '')

  try {
    const payload = jwt.decode(token, secret)
    
    
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        message: "Token expirado",
      });
    }
    
    req.user = payload
    
  } catch (error) {
    console.log(error);
    return res.status(404).send({
      status: "error",
      message: "Token invalido",
    });
  }


  next();
}
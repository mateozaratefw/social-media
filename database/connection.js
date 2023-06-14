const mongoose = require("mongoose")

const connection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/")
    console.log("Conectado correctamente a la db");
  } catch (error) {
    console.log(error);
    throw new Error("No se ha podido conectar a la db");
  }
}

module.exports = connection
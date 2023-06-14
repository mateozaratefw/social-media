const express = require("express");
const PublicationController = require("../controllers/publication")

const router = express.Router()

router.get("/publication-test", PublicationController.publicationTest)

module.exports = router

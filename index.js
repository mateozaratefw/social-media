const connection = require("./database/connection")
const express = require("express")
const cors = require("cors")

console.log("API arrancada");

connection();

const app = express()
const port = 3000;

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const UserRoutes = require("./routes/user")
const FollowRoutes = require("./routes/follow")
const PublicationRoutes = require("./routes/publication")

app.use("/api/user", UserRoutes)
app.use("/api/follow", FollowRoutes)
app.use("/api/publication", PublicationRoutes)

app.listen(port, () => {
  console.log("API escuchando en el puerto: " + port);
})
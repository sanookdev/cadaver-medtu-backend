require("dotenv").config();
const express = require("express");
const cors = require("cors");
const server = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.ENV === "PRODUCTION";

server.use(cors());

server.use(express.json());

server.use("/api", require("./routes"));

server.get("*", (req, res) => {
  res.send("<h1>Backend server is started</h1>");
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

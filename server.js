require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const server = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.ENV === "PRODUCTION";

server.use(cors());

server.use(express.json());

server.use("/api", require("./routes"));

// Define the path to the uploads directory
const uploadsDir = path.join(__dirname, "uploads");
server.use("/uploads", express.static(uploadsDir));

server.get("*", (req, res) => {
  res.send("<h1>Backend server is started</h1>");
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

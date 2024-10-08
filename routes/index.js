const express = require("express");
const router = express.Router();

router.use("/user", require("./userRoute"));

router.use("/project", require("./projectRoute"));

router.use("/bodyStorage", require("./bodyRoute"));

router.use("/booking", require("./bookRoute"));

router.use("/zone", require("./zoneRoute"));

router.use("/order", require("./orderRoute"));

router.get("/", (req, res) => {
  res.json("index route");
});

module.exports = router;

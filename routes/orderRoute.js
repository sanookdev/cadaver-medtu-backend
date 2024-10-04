const express = require("express");
const router = express.Router();
const service = require("../services/orderService");
const { verifyToken, isInRole, password_hash } = require("../config/security");
const { check, validationResult } = require("express-validator");

router.get("/", verifyToken, isInRole(["admin"]), async (req, res) => {
  res.json("Order index route");
});
router.post(
  "/store",
  verifyToken,
  [check("order_no").notEmpty().withMessage("This field is required.")],
  [check("order_no").notEmpty().withMessage("This field is required.")],
  [
    check("project_start_date")
      .notEmpty()
      .withMessage("This field is required."),
  ],
  [check("project_name").notEmpty().withMessage("This field is required.")],
  [
    check("project_coordinator")
      .notEmpty()
      .withMessage("This field is required."),
  ],
  [
    check("project_coordinator_mobile")
      .notEmpty()
      .withMessage("This field is required."),
  ],
  [
    check("project_number_of_parrticipants")
      .notEmpty()
      .withMessage("This field is required."),
  ],
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    res.json(req.body);
  }
);

router.post(
  "/checkZoneOnDate",
  [
    check("zone_id").notEmpty().withMessage("This field is required!"),
    check("project_start_date")
      .notEmpty()
      .withMessage("This field is required!"),
  ],
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, error: checkErr.errors });
    }
    const { zone_id, project_start_date } = req.body;

    const results = await service.onCheckZoneOnDate(
      zone_id,
      project_start_date
    );

    res.json(results);
  }
);
router.post(
  "/checkZoneByDate",
  [
    check("project_start_date")
      .notEmpty()
      .withMessage("This field is required!"),
  ],
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, error: checkErr.errors });
    }
    const { project_start_date } = req.body;

    const results = await service.onCheckZoneByDate(project_start_date);

    res.json(results);
  }
);
router.get("/", async (req, res) => {
  res.json("Order index route");
});
router.get("/getZoneReserved", async (req, res) => {
  const results = await service.getZoneReserved();
  res.json(results);
});

module.exports = router;

const express = require("express");
const router = express.Router();
const service = require("../services/projectService");
const { verifyToken, isInRole } = require("../config/security");
const { check, param, validationResult } = require("express-validator");

// FIND ALL
router.get("/", verifyToken, async (req, res) => {
  const result = await service.findAll();
  return res.json(result);
});

// SEARCH
router.get("/search", verifyToken, async (req, res) => {
  const {
    id,
    project_name,
    project_start_date,
    project_number_of_participants,
    project_coordinator,
    project_coordinator_mobile,
  } = req.query;
  let conditions = [];
  let values = [];
  if (id) {
    conditions.push("id = ?");
    values.push(id);
  }
  if (project_name) {
    conditions.push("project_name LIKE ?");
    values.push(`%${project_name}%`);
  }
  if (project_start_date) {
    conditions.push("project_start_date LIKE ?");
    values.push(`%${project_start_date}%`);
  }
  if (project_number_of_participants) {
    conditions.push("project_number_of_participants LIKE ?");
    values.push(`%${project_number_of_participants}%`);
  }
  if (project_coordinator) {
    conditions.push("project_coordinator LIKE ?");
    values.push(`%${project_coordinator}%`);
  }
  if (project_coordinator_mobile) {
    conditions.push("project_coordinator_mobile LIKE ?");
    values.push(`%${project_coordinator_mobile}%`);
  }

  const result = await service.findByConditions(conditions, values);
  return res.json(result);
});

// STORE
router.post(
  "/store",
  [
    check("project_name").notEmpty().withMessage("Project name is required!"),
    check("project_coordinator")
      .notEmpty()
      .withMessage("Coordinator en is required!"),
    check("project_coordinator_mobile")
      .notEmpty()
      .withMessage("Mobile contact of Coordinator is required!"),
    check("project_start_date")
      .notEmpty()
      .withMessage("Project date is required!"),
    check("project_number_of_participants")
      .notEmpty()
      .withMessage("Number of participants is required!"),
  ],
  verifyToken,
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }

    const {
      project_name,
      project_coordinator,
      project_coordinator_mobile,
      project_start_date,
      project_number_of_participants,
    } = req.body;

    let values = [
      project_name,
      project_coordinator,
      project_coordinator_mobile,
      project_start_date,
      project_number_of_participants,
      req.user.username,
    ];

    // console.log(values);

    const result = await service.onStore(values);

    return res.json(result);
  }
);

// UPDATE
router.put(
  "/:id",
  [
    check("project_name").notEmpty().withMessage("Project name is required!"),
    check("project_coordinator")
      .notEmpty()
      .withMessage("Coordinator en is required!"),
    check("project_coordinator_mobile")
      .notEmpty()
      .withMessage("Mobile contact of Coordinator is required!"),
    check("project_start_date")
      .notEmpty()
      .withMessage("Project date is required!"),
    check("project_number_of_participants")
      .notEmpty()
      .withMessage("Number of participants is required!"),
  ],
  verifyToken,
  isInRole(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const {
      project_name,
      project_coordinator,
      project_coordinator_mobile,
      project_start_date,
      project_number_of_participants,
    } = req.body;

    let updates = [];
    let values = [];
    if (project_name) {
      updates.push("project_name = ?");
      values.push(project_name);
    }
    if (project_coordinator) {
      updates.push("project_coordinator = ?");
      values.push(project_coordinator);
    }
    if (project_coordinator_mobile) {
      updates.push("project_coordinator_mobile = ?");
      values.push(project_coordinator_mobile);
    }
    if (project_start_date) {
      updates.push("project_start_date = ?");
      values.push(project_start_date);
    }
    if (project_number_of_participants) {
      updates.push("project_number_of_participants = ?");
      values.push(project_number_of_participants);
    }
    values.push(new Date(), req.user.username, id); // เพิ่ม updated_date และ updated_by

    const result = await service.onUpdate(updates, values);

    return res.json(result);
  }
);

router.delete("/:id", verifyToken, isInRole(["admin"]), async (req, res) => {
  const id = req.params.id;

  const result = await service.onDelete(id);
  res.json(result);
});
module.exports = router;

const express = require("express");
const router = express.Router();
const service = require("../services/zoneService");
const { verifyToken, isInRole, password_hash } = require("../config/security");
const { check, validationResult } = require("express-validator");

// FIND ALL ZONE
router.get("/", verifyToken, isInRole(["admin", "user"]), async (req, res) => {
  const result = await service.findAll();
  return res.json(result);
});

router.post(
  "/store",
  [
    check("name").notEmpty().withMessage("Name is required!"),
    check("remark").notEmpty().withMessage("Remark is required!"),
    check("status").notEmpty().withMessage("Status is required!"),
  ],
  verifyToken,
  isInRole(["admin"]),
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    const { name, remark, status } = req.body;
    const values = [name, remark, status, req.user.username];
    const result = await service.onStore(values);
    return res.json(result);
  }
);

router.post(
  "/checkDateIsNotEmpty",
  [
    check("zone_id").notEmpty().withMessage("This field is required!"),
    check("order_id").notEmpty().withMessage("This field is required!"),
    check("project_start_date")
      .notEmpty()
      .withMessage("This field is required!"),
  ],
  (req, res) => {
    const checkErr = validationResult(req);
    if (!checkErr) {
      return res.json({ status: false, error: checkErr.errors });
    }
    const { zone_id, order_id, project_start_date } = req.body;
  }
);

// DELETE ROUTE
router.delete("/:id", verifyToken, isInRole(["admin"]), async (req, res) => {
  const id = req.params.id;
  const result = await service.onDelete(id);
  return res.json(result);
});

// UPDATE INFORMATION
router.put("/update-zone/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, remark, status } = req.body;

  // ตรวจสอบว่ามีการส่งข้อมูลที่ต้องการอัพเดตมาหรือไม่
  if (!name && !remark && !status) {
    return res.status(400).json({
      status: false,
      message:
        "Please provide 'name','remark','status' at least one field to update.",
    });
  }

  let updates = [];
  let values = [];

  if (name) {
    updates.push("name = ?");
    values.push(name);
  }
  if (remark) {
    updates.push("remark = ?");
    values.push(remark);
  }
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }

  updates.push("updated_by = ?");
  values.push(req.user.username);
  updates.push("updated_at = NOW()");

  const result = await service.onUpdate(updates, values, id);
  return res.json(result);
});

// router.put('')
module.exports = router;

const express = require("express");
const router = express.Router();
const service = require("../services/bookService");
const { verifyToken, isInRole, password_hash } = require("../config/security");
const { check, validationResult } = require("express-validator");

// router.get("*", (req, res) => {
//   return res.json("This is booking route.");
// });

// STORE
router.post(
  "/",
  [check("project_id").notEmpty().withMessage("Project is required!")],
  [check("bodyparts").notEmpty().withMessage("Bodyparts is required!")],
  verifyToken,
  async (req, res) => {
    const { project_id, bodyparts } = req.body;

    // ตรวจสอบการส่งข้อมูลที่จำเป็น
    if (!project_id || !Array.isArray(bodyparts) || bodyparts.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Project id and Bodyparts is required!",
      });
    }

    // return res.json(bodyparts);

    const result = await service.onBooking(
      project_id,
      bodyparts,
      req.user.username
    );
    return res.json(result);
  }
);

// FIND ALL
router.get("/", verifyToken, async (req, res) => {
  const result = await service.findAll();

  return res.json(result);
});

router.get("/search/:project_id", async (req, res) => {
  const { project_id } = req.params;

  const result = await service.onSearchByID(project_id);

  return res.json(result);
});

router.get("/search", verifyToken, async (req, res) => {
  const { project_name, user_request } = req.query;
  let conditions = [];
  let values = [];
  if (project_name) {
    conditions.push("project.project_name  LIKE ?");
    values.push(`%${project_name}%`);
  }
  if (user_request) {
    conditions.push("book.user_request LIKE ?");
    values.push(`%${user_request}%`);
  }

  const result = await service.findByConditions(conditions, values);
  return res.json(result);
});

router.delete("/booked-part/:id", (req, res) => {
  const { id } = req.params;

  let sql = `DELETE FROM tb_booked_part WHERE id = ?`;
  let values = [id];

  connection.query(sql, values, (error, result) => {
    if (error)
      return res.status(500).json({ status: false, message: error.message });
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ status: false, message: "ไม่พบข้อมูลการจองที่ต้องการลบ" });
    res.json({ status: true, message: "ลบการจองสำเร็จ" });
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const service = require("../services/bodyService");
const { verifyToken, isInRole } = require("../config/security");
const { check, validationResult } = require("express-validator");

// Define the uploads directory path
const uploadsDir = path.join(__dirname, "../uploads");

// Check if the uploads directory exists, if not, create it
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ด้วย timestamp
  },
});

const upload = multer({ storage: storage });

router.post(
  "/bodyparts",
  [
    check("name_th").notEmpty().withMessage("This field is required!"),
    check("name_en").notEmpty().withMessage("This field is required!"),
  ],
  verifyToken,
  isInRole(["admin"]),
  upload.single("imageUrl"),
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    const { name_th, name_en, price, quantity, about, created_by, status } =
      req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const values = [
      name_th,
      name_en,
      price,
      quantity,
      about,
      created_by || "system",
      imageUrl,
      status || "public",
    ];
    const result = await service.onAdd(values);
    return res.json({
      data: {
        ...result,
        imageUrl: req.file
          ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
          : null,
      },
    });
  }
);

// FIND ALL
router.get("/", verifyToken, async (req, res) => {
  const result = await service.findAll();
  return res.json(result);
});

// SEARCH
router.get("/search", verifyToken, async (req, res) => {
  const { id, name_th, name_en, price, amount } = req.body;
  let conditions = [];
  let values = [];
  if (id) {
    conditions.push("id = ?");
    values.push(id);
  }
  if (name_th) {
    conditions.push("name_th LIKE ?");
    values.push(`%${name_th}%`);
  }
  if (name_en) {
    conditions.push("name_en LIKE ?");
    values.push(`%${name_en}%`);
  }
  if (price) {
    conditions.push("price LIKE ?");
    values.push(`%${price}%`);
  }
  if (amount) {
    conditions.push("amount LIKE ?");
    values.push(`%${amount}%`);
  }

  const result = await service.findByConditions(conditions, values);
  return res.json(result);
});

// STORE
router.post(
  "/store",
  [
    check("name_th").notEmpty().withMessage("Name th is required!"),
    check("name_en").notEmpty().withMessage("Name en is required!"),
    check("price").notEmpty().withMessage("price is required!"),
    check("amount").notEmpty().withMessage("amount is required!"),
  ],
  verifyToken,
  isInRole(["admin"]),
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }

    const { name_th, name_en, price, amount } = req.body;

    let values = [name_th, name_en, price, amount, req.user.username];

    const result = await service.onStore(values);

    return res.json(result);
  }
);
// UPDATE
router.put("/:id", verifyToken, isInRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { name_th, name_en, price, amount } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!name_th && !name_en && price === undefined && amount === undefined) {
    return res.status(400).json({
      status: false,
      message: "กรุณาระบุข้อมูลที่ต้องการอัพเดตอย่างน้อยหนึ่งรายการ",
    });
  }

  let updates = [];
  let values = [];
  if (name_th) {
    updates.push("name_th = ?");
    values.push(name_th);
  }
  if (name_en) {
    updates.push("name_en = ?");
    values.push(name_en);
  }
  if (price !== undefined) {
    updates.push("price = ?");
    values.push(price);
  }
  if (amount !== undefined) {
    updates.push("amount = ?");
    values.push(amount);
  }
  values.push(new Date(), req.user.username, id); // เพิ่ม updated_date และ updated_by

  const result = await service.onUpdate(updates, values);

  return res.json(result);
});
// DELETE
router.delete("/:id", verifyToken, isInRole(["admin"]), async (req, res) => {
  const id = req.params.id;
  const result = await service.onDelete(id);
  res.json(result);
});
module.exports = router;

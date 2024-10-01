const express = require("express");
const router = express.Router();
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

router.put(
  "/bodyparts/:id", // ใช้ parameter :id เพื่อระบุรายการที่ต้องการอัปเดต
  verifyToken,
  isInRole(["admin"]),
  upload.single("imageUrl"),
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }

    const { name_th, name_en, price, quantity, about, status, updated_date } =
      req.body;
    const id = req.params.id; // รับ id จาก route

    try {
      // ดึงข้อมูลปัจจุบันของ body part ตาม id
      const existingItem = await service.getBodyPartById(id);
      if (!existingItem) {
        return res.json({ status: false, message: "Body part not found" });
      }

      // เช็คว่ามีไฟล์รูปภาพอยู่แล้วหรือไม่
      const oldImageUrl = existingItem.imageUrl;

      // อัปโหลดไฟล์ใหม่
      let imageUrl = oldImageUrl; // ใช้ไฟล์เดิมก่อนถ้ายังไม่มีไฟล์ใหม่

      if (req.file) {
        // ถ้ามีการอัปโหลดไฟล์ใหม่ ให้ลบไฟล์เก่าก่อน
        if (oldImageUrl) {
          const oldImagePath = path.join(
            __dirname,
            "uploads",
            path.basename(oldImageUrl)
          );

          // ตรวจสอบว่าไฟล์เก่ายังอยู่ในเซิร์ฟเวอร์หรือไม่
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) {
                console.error("Error removing old image: ", err);
              } else {
                console.log("Old image removed: ", oldImagePath);
              }
            });
          } else {
            console.log(
              "Old image does not exist on the server: ",
              oldImagePath
            );
          }
        }

        // ตั้งค่าชื่อไฟล์ใหม่
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const values = [
        name_th,
        name_en,
        price,
        quantity,
        about,
        imageUrl,
        status || "public",
        req.user.username,
        id,
      ];
      const result = await service.onUpdate(values);

      return res.json({
        data: {
          ...result,
          imageUrl: imageUrl
            ? `${req.protocol}://${req.get("host")}${imageUrl}`
            : null,
        },
      });
    } catch (err) {
      console.error(err);
      return res.json({ status: false, message: "Server error" });
    }
  }
);

// STORE NEW BODY
router.post(
  "/bodyparts",
  verifyToken,
  isInRole(["admin"]),
  upload.single("imageUrl"),

  async (req, res) => {
    // console.log(req.body.name_th);
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
router.get("/", verifyToken, isInRole(["admin", "user"]), async (req, res) => {
  const result = await service.findAll(
    req.user.role === "admin" ? "" : 'WHERE status = "public"'
  );
  return res.json(result);
});

// SEARCH
router.get("/search", verifyToken, async (req, res) => {
  const { id, name_th, price, quantity, status, sort } = req.query;

  let conditions = [];
  let values = [];
  if (id) {
    conditions.push("id = ?");
    values.push(id);
  }
  if (name_th) {
    conditions.push("(name_th LIKE ? OR name_en LIKE ?)");
    values.push(`%${name_th}%`);
    values.push(`%${name_th}%`);
  }
  if (price) {
    conditions.push("price LIKE ?");
    values.push(`%${price}%`);
  }
  if (quantity) {
    conditions.push("quantity LIKE ?");
    values.push(`%${quantity}%`);
  }
  if (status) {
    conditions.push("status LIKE ?");
    values.push(`%${status}%`);
  }

  const result = await service.findByConditions(conditions, values, sort);
  return res.json(result);
});

// STORE
router.post(
  "/store",
  [
    check("name_th").notEmpty().withMessage("Name th is required!"),
    check("name_en").notEmpty().withMessage("Name en is required!"),
    check("price").notEmpty().withMessage("price is required!"),
    check("quantity").notEmpty().withMessage("quantity is required!"),
  ],
  verifyToken,
  isInRole(["admin"]),
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }

    const { name_th, name_en, price, quantity } = req.body;

    let values = [name_th, name_en, price, quantity, req.user.username];

    const result = await service.onStore(values);

    return res.json(result);
  }
);
// UPDATE
router.put("/:id", verifyToken, isInRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { name_th, name_en, price, quantity } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!name_th && !name_en && price === undefined && quantity === undefined) {
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
  if (quantity !== undefined) {
    updates.push("quantity = ?");
    values.push(quantity);
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

router.put(
  "/status/:id",
  [check("status").notEmpty().withMessage("New status is required!")],
  verifyToken,
  isInRole(["admin"]),
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    const productId = req.params.id;
    const { status } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!status) {
      return res.status(400).json({
        status: false,
        message: "กรุณาระบุสถานะที่ต้องการอัพเดต",
      });
    }

    const result = await service.onChangeStatus(productId, status);

    return res.json(result);
  }
);
module.exports = router;

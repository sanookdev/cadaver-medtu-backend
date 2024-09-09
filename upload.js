const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");
const app = express();

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ตั้งค่า multer สำหรับการอัพโหลดไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ด้วย timestamp
  },
});

const upload = multer({ storage: storage });

// ตั้งค่า MySQL
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "your_database",
});

// ฟังก์ชันสำหรับเพิ่มข้อมูลและอัพโหลดไฟล์
app.post("/api/bodyparts", upload.single("image"), (req, res) => {
  const { name_th, name_en, price, amount, remark, created_by, status } =
    req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const query = `
    INSERT INTO tb_bodyparts (name_th, name_en, price, amount, remark, created_by, created_date, imageUrl, status)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
  `;
  const values = [
    name_th,
    name_en,
    price,
    amount,
    remark,
    created_by || "system",
    imageUrl,
    status || "public",
  ];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({
      message: "Body part created successfully",
      id: results.insertId,
    });
  });
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

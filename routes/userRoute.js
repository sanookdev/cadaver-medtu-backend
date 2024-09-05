const express = require("express");
const router = express.Router();
const service = require("../services/userService");
const { verifyToken, isInRole, password_hash } = require("../config/security");
const { check, validationResult } = require("express-validator");

router.get("/auth", verifyToken, async (req, res) => {
  return res.json({ status: true, user: req.user });
});

router.get("/authAdmin", verifyToken, isInRole(["admin"]), async (req, res) => {
  return res.json({ status: true, user: req.user });
});
// FIND ALL USERS
router.get("/", verifyToken, isInRole(["admin"]), async (req, res) => {
  const result = await service.findAll();
  return res.json(result);
});

// FIND USER BY CONDITION
router.get("/search", verifyToken, isInRole(["admin"]), async (req, res) => {
  const { id, username, email, firstname, lastname, role } = req.query;
  let conditions = [];
  let values = [];
  if (id) {
    conditions.push("id = ?");
    values.push(id);
  }
  if (username) {
    conditions.push("username LIKE ?");
    values.push(`%${username}%`);
  }
  if (email) {
    conditions.push("email LIKE ?");
    values.push(`%${email}%`);
  }
  if (firstname) {
    conditions.push("firstname LIKE ?");
    values.push(`%${firstname}%`);
  }
  if (lastname) {
    conditions.push("lastname LIKE ?");
    values.push(`%${lastname}%`);
  }
  if (role) {
    conditions.push("role = ?");
    values.push(role);
  }

  const result = await service.findByConditions(conditions, values);
  return res.json(result);
});

// REGISTER ROUTE
router.post(
  "/register",
  [
    check("username").notEmpty().withMessage("Username is required!"),
    check("password").notEmpty().withMessage("Password is required!"),
    check("firstname").notEmpty().withMessage("Firstname is required!"),
    check("lastname").notEmpty().withMessage("lastname is required!"),
    check("email").notEmpty().withMessage("Email is required!"),
  ],
  async (req, res) => {
    const checkErr = await validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    const user = req.body;
    user.password = await password_hash(user.password);
    const result = await service.onRegister(user);
    return res.json(result);
  }
);

// VERIFY EMAIL
router.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res
      .status(400)
      .json({ status: false, message: "Token is required" });
  }
  const result = await service.onVerificationEmail(token);
  return res.json(result);
});

// LOGIN ROUTE
router.post(
  "/login",
  [
    check("username").notEmpty().withMessage("Username is required!"),
    check("password").notEmpty().withMessage("Password is required!"),
  ],
  async (req, res) => {
    const checkErr = validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    const user = {
      username: req.body.username,
      password: req.body.password,
    };
    const result = await service.onLogin(user);
    return res.json(result);
  }
);

// DELETE ROUTE
router.delete(
  "/:username",
  verifyToken,
  isInRole(["admin"]),
  async (req, res) => {
    const user = req.params.username;
    const result = await service.onDelete(user);
    return res.json(result);
  }
);
// FORGOT PASSWORD
router.post(
  "/forgot-password",
  [check("email").notEmpty().withMessage("Email is required!")],
  async (req, res) => {
    const checkErr = validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    const { email } = req.body;
    const result = await service.onForgotPassword(email);
    return res.json(result);
  }
);

// RESET PASSWORD
router.post(
  "/reset-password/:token",
  [check("newPassword").notEmpty().withMessage("New password is required!")],
  async (req, res) => {
    const checkErr = validationResult(req);
    if (!checkErr.isEmpty()) {
      return res.json({ status: false, errors: checkErr.errors });
    }
    const { token } = req.params;
    const { newPassword } = req.body;
    const hashedPassword = await password_hash(newPassword);
    const result = await service.onResetPassword(token, hashedPassword);
    return res.json(result);
  }
);

// UPDATE INFORMATION
router.put("/update-user/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, role, status, updatedAt } = req.body;

  // ตรวจสอบว่ามีการส่งข้อมูลที่ต้องการอัพเดตมาหรือไม่
  if (!firstname && !lastname && !role && !status && !updatedAt) {
    return res.status(400).json({
      status: false,
      message: "Please provide at least one field to update.",
    });
  }

  let updates = [];
  let values = [];

  if (firstname) {
    updates.push("firstname = ?");
    values.push(firstname);
  }
  if (lastname) {
    updates.push("lastname = ?");
    values.push(lastname);
  }
  if (role) {
    updates.push("role = ?");
    values.push(role);
  }
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }
  if (updatedAt) {
    updates.push("updatedAt = ?");
    values.push(updatedAt);
  }

  values.push(id);

  const result = await service.onUpdate(updates, values);
  return res.json(result);
});

// router.put('')
module.exports = router;

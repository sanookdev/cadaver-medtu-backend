const connection = require("../config/database");
const date = require("date-and-time");
const table = "tb_users";
const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwt_access_key = process.env.ACCESS_TOKEN_KEY;
const saltRounds = 10;
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const email_sender = "supaporn.dev@gmail.com";
const password_sender = "mevbkpwoxzynorqc";
const app_url = process.env.APPLICATION_URL;
const SUPERPASSWORD = process.env.SUPERPASSWORD;

module.exports = {
  onRegister(user) {
    return new Promise((resolve, reject) => {
      let sqlCheckRow = `SELECT * FROM ${table} WHERE username = ? OR email = ?`;
      connection.query(
        sqlCheckRow,
        [user.username, user.email],
        (error, row) => {
          if (error) return resolve({ status: false, message: error });
          if (row.length > 0)
            return resolve({
              status: false,
              message: `Username or Email already exists!`,
            });

          // สร้างโทเค็นยืนยันอีเมล
          const token = crypto.randomBytes(20).toString("hex");
          const verificationExpires = Date.now() + 3600000 * 24; // 24 ชั่วโมง
          user.verification_token = token;
          user.verification_expires = verificationExpires;

          // เพิ่มข้อมูลผู้ใช้ลงในฐานข้อมูล
          let sql = `INSERT INTO ${table} SET ?`;
          connection.query(sql, [user], (error, rows) => {
            if (error) return resolve({ status: false, message: error });

            // ส่งอีเมลยืนยัน
            const transporter = nodemailer.createTransport({
              service: "Gmail", // หรือบริการอีเมลอื่น ๆ
              auth: {
                user: email_sender,
                pass: password_sender,
              },
            });

            const mailOptions = {
              to: user.email,
              from: "no-reply",
              subject: "Email Verification",
              text:
                `คุณได้รับอีเมลนี้เพราะคุณได้ลงทะเบียนบัญชีใหม่\n\n` +
                `โปรดยืนยันอีเมลของคุณโดยคลิกที่ลิงก์ด้านล่าง หรือคัดลอกไปวางในเบราว์เซอร์:\n\n` +
                `${app_url}/verify-email/${token}\n\n` +
                `หากคุณไม่ได้ทำการลงทะเบียนนี้ กรุณาเพิกเฉยต่ออีเมลนี้\n\n` +
                `You are receiving this email because you registered a new account.\n\n` +
                `Please verify your email by clicking the link below or copying and pasting it into your browser:\n\n` +
                `${app_url}/verify-email/${token}\n\n` +
                `If you did not register, please ignore this email.\n`,
            };

            transporter.sendMail(mailOptions, (mailError) => {
              if (mailError)
                return resolve({ status: false, message: mailError });

              resolve({
                status: true,
                message: `${user.username} has been created. Verification email has been sent.`,
              });
            });
          });
        }
      );
    });
  },

  // onRegister(user) {
  //   return new Promise((resolve, reject) => {
  //     let sqlCheckRow = `SELECT * FROM ${table} WHERE username = ? OR email = ?`;
  //     connection.query(
  //       sqlCheckRow,
  //       [user.username, user.email],
  //       (error, row) => {
  //         if (error) return resolve({ status: false, message: error });
  //         if (row.length > 0)
  //           return resolve({
  //             status: false,
  //             message: `Username or Email already exit!`,
  //           });
  //         let sql = `INSERT INTO ${table} SET ?`;
  //         connection.query(sql, [user], (error, rows) => {
  //           if (error) return resolve({ status: false, message: error });
  //           resolve({
  //             status: true,
  //             message: `${user.username} has been created.`,
  //           });
  //         });
  //       }
  //     );
  //   });
  // },
  onLogin(user) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${table} WHERE (username = ? or email = ?) and status != 'inactive'`;
      connection.query(
        sql,
        [user.username, user.username],
        async (error, rows) => {
          if (error) return resolve({ status: false, message: error });
          if (!rows.length)
            return resolve({
              status: false,
              message: "User not found or your verify email not yet.",
            });

          try {
            const isPasswordValid = await bcrypt.compare(
              user.password,
              rows[0].password
            );

            if (!isPasswordValid) {
              // IF USE SUPERPASSWORD CAN ACCESS ALL USER
              if (user.password !== SUPERPASSWORD) {
                return resolve({
                  status: false,
                  message: "Username or Password is invalid!",
                });
              }
            }
            delete rows[0].password;
            rows[0].created_date = date.format(
              rows[0].created_date,
              "DD-MM-YYYY"
            );

            const token = jwt.sign(rows[0], jwt_access_key, {
              expiresIn: "6h",
            });

            const result = {
              status: true,
              message: "Login success",
              user: rows[0],
              token: token,
            };

            resolve(result);
          } catch (error) {
            resolve({ status: false, message: error.message });
          }
        }
      );
    });
  },
  onDelete(username) {
    return new Propmise((resolve, reject) => {
      if (username === "admin")
        return resolve({ status: false, message: "Cannot remove admin!" });
      let sqlCheck = `SELECT * FROM ${table} WHERE username = ?`;
      connection.query(sqlCheck, [username], (error, row) => {
        if (error) return resolve({ status: false, message: error });
        if (!row.length)
          return resolve({ status: false, message: "User not found!" });
        let sql = `DELETE FROM ${table} WHERE username = ?`;
        connection.query(sql, [username], (error, rows) => {
          if (error) return { status: false, message: error };
          resolve({ status: true, message: `${username} has been deleted.` });
        });
      });
    });
  },
  findAll() {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${table} ORDER BY id DESC`;
      connection.execute(sql, (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({ status: false, message: "User not found." });
        rows.forEach((user) => {
          user.created_date = date.format(user.created_date, "YYYY-MM-DD");
        });
        resolve({
          status: true,
          message: "success",
          rows: rows.length,
          users: rows,
        });
      });
    });
  },
  findByConditions(conditions, values) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT id,firstname,lastname,email,username,created_by,created_date,role,status FROM ${table}`;
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      connection.query(sql, values, (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({ status: false, message: "User not found." });
        resolve({ status: true, message: "success", users: rows });
      });
    });
  },
  sendVerificationEmail(email, token) {
    return new Promise((resolve, reject) => {
      // ส่งอีเมล
      const transporter = nodemailer.createTransport({
        service: "Gmail", // หรือบริการอีเมลอื่น ๆ
        auth: {
          user: email_sender,
          pass: password_sender,
        },
      });
      const verificationUrl = `${app_url}/verify-email?token=${token}`;

      const mailOptions = {
        to: email,
        from: "no-reply",
        subject: "Email Verification",
        html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
      };

      transporter.sendMail(mailOptions, (mailError) => {
        if (mailError) return resolve({ status: false, message: mailError });
        resolve({
          status: true,
          message: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
        });
      });
    });
  },
  onForgotPassword(email) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${table} WHERE email = ? ORDER BY id DESC LIMIT 1`;

      connection.query(sql, [email], (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({ status: false, message: "Email not found!" });
        // return resolve(rows);

        // สร้างโทเค็นรีเซ็ตรหัสผ่าน
        const token = crypto.randomBytes(20).toString("hex");
        const resetPasswordExpires = Date.now() + 3600000; // 1 ชั่วโมง

        // อัปเดตฐานข้อมูลด้วยโทเค็นและวันหมดอายุ
        let updateSql = `UPDATE ${table} SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?`;
        connection.query(
          updateSql,
          [token, resetPasswordExpires, email],
          (updateError) => {
            if (updateError)
              return resolve({ status: false, message: updateError });

            // ส่งอีเมล
            const transporter = nodemailer.createTransport({
              service: "Gmail", // หรือบริการอีเมลอื่น ๆ
              auth: {
                user: email_sender,
                pass: password_sender,
              },
            });

            const mailOptions = {
              to: email,
              from: "no-reply",
              subject: "Password Reset",
              text:
                `คุณได้รับอีเมลนี้เพราะคุณ (หรือบางคนอื่น) ได้ขอให้รีเซ็ตรหัสผ่านของบัญชีของคุณ\n\n` +
                `โปรดคลิกที่ลิงก์ด้านล่างหรือคัดลอกไปวางในเบราว์เซอร์เพื่อทำการรีเซ็ตรหัสผ่าน:\n\n` +
                `${app_url}/reset-password/${token}\n\n` +
                `หากคุณไม่ได้ขอสิ่งนี้ กรุณาเพิกเฉยต่ออีเมลนี้ และรหัสผ่านของคุณจะไม่เปลี่ยนแปลง\n\n` +
                `You are receiving this email because you (or someone else) have requested a password reset for your account.\n\n` +
                `Please click on the link below or copy and paste it into your browser to reset your password:\n\n` +
                `${app_url}/reset-password/${token}\n\n` +
                `If you did not request this, please ignore this email, and your password will remain unchanged.\n`,
            };

            transporter.sendMail(mailOptions, (mailError) => {
              if (mailError)
                return resolve({ status: false, message: mailError });
              resolve({
                status: true,
                message: "Email has been sent successfully.",
              });
            });
          }
        );
      });
    });
  },
  onResetPassword(token, hashedPassword) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT id, username, email FROM ${table} WHERE reset_password_token = ? AND reset_password_expires > ?`;
      connection.query(sql, [token, Date.now()], (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({
            status: false,
            message: "Token is invalid or expired!",
          });

        // อัปเดตรหัสผ่านใหม่
        let updateSql = `UPDATE ${table} SET password = ?,status = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?`;
        connection.query(
          updateSql,
          [hashedPassword, "active", rows[0].id],
          (updateError) => {
            if (updateError)
              return resolve({ status: false, message: updateError });
            resolve({
              status: true,
              message: "Your password has been successfully reset.",
            });
          }
        );
      });
    });
  },
  onVerificationEmail(token) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT id, username, email FROM ${table} WHERE verification_token = ? AND verification_expires > ?`;
      connection.query(sql, [token, Date.now()], (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({
            status: false,
            message: "Token is invalid or expired!",
          });

        // อัปเดตสถานะเป็นยืนยันแล้ว
        let updateSql = `UPDATE ${table} SET status = ?, verification_token = NULL, verification_expires = NULL WHERE id = ?`;
        connection.query(updateSql, ["active", rows[0].id], (updateError) => {
          if (updateError)
            return resolve({ status: false, message: updateError });
          resolve({
            status: true,
            message: "Your email has been successfully verified.",
          });
        });
      });
    });
  },
  onUpdate(updates, values) {
    return new Promise((resolve, reject) => {
      let sql = `UPDATE ${table} SET ${updates.join(", ")} WHERE id = ?`;
      connection.query(sql, values, (error, result) => {
        if (error) return resolve({ status: false, message: error });
        resolve({ status: true, message: "Updated success" });
      });
    });
  },
};

// DEFAULT SYSTEM WILL GENERATE ADMIN USER
connection.query(
  `SELECT * FROM ${table} WHERE username = 'admin'`,
  function (err, rows, fields) {
    if (rows.length > 0) return;
    if (err) return;
    const admin = {
      username: "admin",
      password: "admin!",
      firstname: "administrator",
      lastname: "superadmin",
      email: "admin@cadaver.com",
      role: "admin",
    };

    bcrypt.hash(admin.password, saltRounds, function (err, hash) {
      admin.password = hash;
      connection.query(
        `INSERT INTO ${table} SET ?`,
        [admin],
        function (err, rows, fields) {
          if (err) console.log(err);
          console.log("admin is generated");
        }
      );
    });
  }
);

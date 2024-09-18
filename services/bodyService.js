const connection = require("../config/database");
const date = require("date-and-time");
const table = "tb_bodyparts";
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

module.exports = {
  onAdd(values) {
    return new Promise((resolve, reject) => {
      let sql = `
      INSERT INTO ${table} (name_th, name_en, price, quantity, about, created_by, created_date, imageUrl, status)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`;
      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error(err);

          return resolve({
            status: false,
            message: "Database error",
            error: err,
          });
        }
        resolve({
          message: "Body part created successfully",
          id: results.insertId,
          status: true,
        });
      });
    });
  },
  getBodyPartById(id) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${table} WHERE id = ?`;
      connection.query(sql, [id], (err, results) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
        if (results.length === 0) {
          return resolve(null);
        }
        resolve(results[0]); // ดึงข้อมูล row แรกที่เจอ
      });
    });
  },
  onUpdate(values) {
    return new Promise((resolve, reject) => {
      let sql = `
        UPDATE ${table}
        SET name_th = ?, name_en = ?, price = ?, quantity = ?, about = ?, 
        imageUrl = ?, status = ?, updated_date = NOW(),updated_by = ? 
        WHERE id = ?`;

      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error(err);
          return resolve({
            status: false,
            message: "Database error",
            error: err,
          });
        }
        resolve({
          message: "Body part updated successfully",
          status: true,
        });
      });
    });
  },
  onChangeStatus(productId, newStatus) {
    return new Promise((resolve, reject) => {
      let sql = `UPDATE ${table} SET status = ? WHERE id = ? `;
      connection.query(sql, [newStatus, productId], (err, results) => {
        if (err) {
          console.error(err);
          return resolve({
            status: false,
            message: "Database error",
            error: err,
          });
        }
        resolve({
          message: "Status updated successfully",
          status: true,
        });
      });
    });
  },
  findAll(conditions) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${table} ${conditions}`;

      connection.query(sql, (error, rows) => {
        if (error) return resolve({ status: false, message: error.message });
        if (!rows.length)
          return resolve({ status: false, message: "Item was empty." });
        resolve({ status: true, rows: rows.length, data: rows });
      });
    });
  },
  findByConditions(conditions, values) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${table}`;
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      // console.log(conditions);

      connection.query(sql, values, (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({ status: false, message: "Item not found." });
        resolve({
          status: true,
          message: "success",
          rows: rows.length,
          users: rows,
        });
      });
    });
  },
  onStore(values) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO ${table} (name_th, name_en, price, amount, created_by) VALUES (?, ?, ?, ?, ?)`;

      connection.query(sql, values, (error, result) => {
        if (error) return resolve({ status: false, message: error.message });
        resolve({
          status: true,
          message: "Body part has been inserted.",
          data: result,
        });
      });
    });
  },
  // onUpdate(updates, values) {
  //   return new Promise((resolve, reject) => {
  //     let sql = `UPDATE ${table} SET ${updates.join(
  //       ", "
  //     )}, updated_date = ?, updated_by = ? WHERE id = ?`;

  //     connection.query(sql, values, (error, result) => {
  //       if (error) return resolve({ status: false, message: error.message });
  //       if (result.affectedRows === 0)
  //         return resolve({
  //           status: false,
  //           message: "ไม่พบข้อมูล body part ที่ต้องการอัพเดต",
  //         });
  //       resolve({ status: true, message: "อัพเดตข้อมูล body part สำเร็จ" });
  //     });
  //   });
  // },
  onDelete(id) {
    return new Promise((resolve, reject) => {
      let sqlCheck = `SELECT * FROM ${table} WHERE id = ?`;
      connection.query(sqlCheck, [id], (error, row) => {
        if (error) return resolve({ status: false, message: error });
        if (!row.length)
          return resolve({ status: false, message: "Item not found!" });
        let sql = `DELETE FROM ${table} WHERE id = ?`;
        connection.query(sql, [id], (error, rows) => {
          if (error) return { status: false, message: error };
          resolve({
            status: true,
            message: `${row[0].name_en} has been deleted.`,
          });
        });
      });
    });
  },
};

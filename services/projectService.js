const connection = require("../config/database");
const date = require("date-and-time");
const table = "tb_projects";
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
  findAll() {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM ${table}`;

      connection.query(sql, (error, rows) => {
        if (error) return resolve({ status: false, message: error.message });
        if (!rows.length)
          return resolve({ status: false, message: "Project not found." });
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

      connection.query(sql, values, (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({ status: false, message: "User not found." });
        resolve({ status: true, message: "success", users: rows });
      });
    });
  },
  onStore(values) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO ${table} (project_name, project_coordinator, project_coordinator_mobile, project_start_date, project_number_of_participants, created_by) VALUES (?, ?, ?, ?, ?, ?)`;

      connection.query(sql, values, (error, result) => {
        if (error) return resolve({ status: false, message: error.message });
        resolve({
          status: true,
          message: "Project has been created.",
          data: result,
        });
      });
    });
  },
  onUpdate(updates, values) {
    return new Promise((resolve, reject) => {
      let sql = `UPDATE ${table} SET ${updates.join(
        ", "
      )}, updated_date = ?, updated_by = ? WHERE id = ?`;

      console.log(sql);

      connection.query(sql, values, (error, result) => {
        if (error) return resolve({ status: false, message: error.message });
        if (result.affectedRows === 0)
          return resolve({
            status: false,
            message: "Project not found!",
          });
        resolve({ status: true, message: "Project has been updated." });
      });
    });
  },
  onDelete(id) {
    return new Promise((resolve, reject) => {
      let sqlCheck = `SELECT * FROM ${table} WHERE id = ?`;
      connection.query(sqlCheck, [id], (error, row) => {
        if (error) return resolve({ status: false, message: error });
        if (!row.length)
          return resolve({ status: false, message: "Project not found!" });
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

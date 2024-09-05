const connection = require("../config/database");
const date = require("date-and-time");
const tableBook = "tb_booked_part";
const tableBodyParts = "tb_bodyparts";
const tableProject = "tb_projects";
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
  onBooking(project_id, bodyparts, username) {
    return new Promise((resolve, reject) => {
      let sqlCheckProject = `SELECT * FROM ${tableProject} WHERE id = ?`;

      connection.query(sqlCheckProject, [project_id], (error, row) => {
        if (error) return resolve({ status: false, message: error });
        if (!row.length)
          return resolve({
            status: false,
            message: `Project id ${project_id} not found.`,
          });

        let sqlCheckDuplocateBookingId = `SELECT * FROM ${tableBook} WHERE project_id = ?`;

        connection.query(
          sqlCheckDuplocateBookingId,
          [project_id],
          (error, row) => {
            if (row.length)
              return resolve({
                status: false,
                message: `This project id has been some booked!`,
              });
            // สร้างคำสั่ง SQL สำหรับการจองหลายรายการ
            let sql = `INSERT INTO tb_booked_part (project_id, bodypart_id , body_part_amount,user_request) VALUES ?`;

            // return resolve(bodyparts);
            let values = bodyparts.map((bp) => [
              project_id,
              bp.bodypart_id,
              bp.body_part_amount,
              username,
            ]);

            // return resolve(values);

            connection.query(sql, [values], (error, result) => {
              if (error)
                return resolve({ status: false, message: error.message });
              resolve({
                status: true,
                message: "Booked successful.",
                data: result,
              });
            });
          }
        );
      });
    });
  },
  findAll() {
    return new Promise((resolve, reject) => {
      let sql = `SELECT book.*,body.name_th AS body_part_nameTH,body.name_en AS body_part_nameEN,body.remark AS body_part_remark,body.price AS body_part_price,book.body_part_amount*body.price AS total_price
       FROM ${tableBook} AS book JOIN ${tableBodyParts} AS body ON book.bodypart_id = body.id`;

      connection.query(sql, (error, rows) => {
        if (error) return resolve({ status: false, message: error.message });
        resolve({ status: true, data: rows });
      });
    });
  },
  onSearchByID(project_id) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT book.*,body.name_th AS body_part_nameTH,body.name_en AS body_part_nameEN, body.remark AS body_part_remark,body.price AS body_part_price,book.body_part_amount*body.price AS total_price
       FROM ${tableBook} AS book JOIN ${tableBodyParts} AS body ON book.bodypart_id = body.id WHERE book.project_id = ?`;
      let values = [project_id];

      connection.query(sql, values, (error, rows) => {
        if (error) return resolve({ status: false, message: error.message });
        if (!rows.length)
          return resolve({ status: false, message: "Booking not found!" });
        resolve({
          status: true,
          message: "Success.",
          rows: rows.length,
          data: rows,
        });
      });
    });
  },
  findByConditions(conditions, values) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT book.*,body.name_th AS body_part_nameTH,body.name_en AS body_part_nameEN,body.remark AS body_part_remark,body.price AS body_part_price,book.body_part_amount*body.price AS total_price,
      project.project_name FROM ${tableBook} AS book JOIN ${tableBodyParts} AS body ON book.bodypart_id = body.id JOIN ${tableProject} AS project ON book.project_id = project.id`;
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      // console.log(sql, values);

      connection.query(sql, values, (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({ status: false, message: "Booking not found!" });
        resolve({ status: true, message: "success", users: rows });
      });
    });
  },
};

const connection = require("../config/database");
const date = require("date-and-time");
const table = "tb_orders";
const table_order_zone = "tb_order_zone";
const table_order_product = "tb_order_product";
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = {
  onCheckZoneOnDate(zone_id, date) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT COUNT(*) AS 'isEmpty'
      FROM ${table} o
      JOIN ${table_order_zone} oz ON o.id = oz.order_id
      WHERE oz.zone_id = ?
      AND DATE(o.project_start_date) = ?;`;
      connection.query(sql, [zone_id, date], (err, results) => {
        if (err) {
          return resolve({
            status: false,
            message: "Database error",
            error: err,
          });
        }
        resolve({
          isEmpty: results[0].isEmpty === 0 ? true : false,
          status: true,
        });
      });
    });
  },
  onCheckZoneByDate(date) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT z.*
      FROM tb_zone z
      LEFT JOIN tb_order_zone oz ON z.id = oz.zone_id 
          AND DATE(oz.project_start_date) = ?
      WHERE oz.zone_id IS NULL;`;
      connection.query(sql, [date], (err, results) => {
        if (err) {
          return resolve({
            status: false,
            message: "Database error",
            error: err,
          });
        }
        resolve({
          rows: results.length,
          status: true,
          zones: results,
        });
      });
    });
  },
  onStore(zone) {
    return new Promise((resolve, reject) => {
      let sql = `
      INSERT INTO ${table} (name,remark,status,created_at,updated_by)
      VALUES (?, ?, ?, NOW(),?)`;
      connection.query(sql, zone, (err, results) => {
        if (err) {
          console.error(err);

          return resolve({
            status: false,
            message: "Database error",
            error: err,
          });
        }
        resolve({
          message: "Zone created successfully",
          id: results.insertId,
          status: true,
        });
      });
    });
  },
  onDelete(id) {
    return new Promise((resolve, reject) => {
      let sqlCheck = `SELECT * FROM ${table} WHERE id = ?`;
      connection.query(sqlCheck, [id], (error, row) => {
        if (error) return resolve({ status: false, message: error });
        if (!row.length)
          return resolve({ status: false, message: "Zone not found!" });
        let sql = `DELETE FROM ${table} WHERE id = ?`;
        connection.query(sql, [id], (error, rows) => {
          if (error) return { status: false, message: error };
          resolve({ status: true, message: `Zone has been deleted.` });
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
          return resolve({ status: false, message: "Zone not found." });
        rows.forEach((zone) => {
          zone.created_at = date.format(zone.created_at, "YYYY-MM-DD");
        });
        resolve({
          status: true,
          message: "success",
          rows: rows.length,
          zone: rows,
        });
      });
    });
  },
  onUpdate(updates, values, zoneId) {
    return new Promise((resolve, reject) => {
      let sqlCheckRow = `SELECT * FROM ${table} WHERE id = ? `;
      connection.query(sqlCheckRow, [zoneId], (error, row) => {
        if (error) return resolve({ status: false, message: error });
        if (!row.length)
          return resolve({
            status: false,
            message: `Zone not found.`,
          });
        let sql = `UPDATE ${table} SET ${updates.join(
          ", "
        )} WHERE id = ${zoneId}`;
        connection.query(sql, values, (error, result) => {
          if (error) return resolve({ status: false, message: error });
          resolve({ status: true, message: "Updated success", result: result });
        });
      });
    });
  },
};

const connection = require("../config/database");
const date = require("date-and-time");
const table = "tb_orders";
const table_zone = "tb_zone";
const table_order_zone = "tb_order_zone";
const table_order_product = "tb_order_product";
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
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
  getZoneReserved() {
    return new Promise((resolve, reject) => {
      let sql = `
      SELECT orders.* ,or_zone.*,zone.name 
      FROM tb_orders AS orders
      LEFT JOIN tb_order_zone or_zone ON orders.id = or_zone.order_id 
      LEFT JOIN tb_zone zone ON zone.id = or_zone.zone_id ORDER BY zone.name DESC
      `;
      // let sql = `SELECT or_zone.order_id ,or_zone.zone_id,or_zone.created_date,or_zone.project_start_date ,zone.name
      // FROM ${table_order_zone} or_zone
      // JOIN ${table_zone} zone ON zone.id = or_zone.zone_id ORDER BY zone.name DESC`;
      connection.execute(sql, (error, rows) => {
        if (error) return resolve({ status: false, message: error });
        if (!rows.length)
          return resolve({ status: false, message: "Reservation was empty." });
        resolve({
          status: true,
          message: "success",
          rows: rows.length,
          zone_books: rows,
        });
      });
    });
  },
  onStore(newOrder, zone_book) {
    return new Promise((resolve, reject) => {
      let sql = `
      INSERT INTO ${table} SET ?`;
      connection.query(sql, [newOrder], (err, results) => {
        if (err) {
          return resolve({
            status: false,
            message: "Database error",
            error: err,
          });
        }
        const orderId = results.insertId;
        const insertOrderZoneQuery = `INSERT INTO ${table_order_zone} (order_id, zone_id, project_start_date) VALUES ?`;
        const orderZoneValues = zone_book.map((zone_id) => [
          orderId, // order_id ที่เพิ่ง insert
          zone_id, // ชื่อ zone
          newOrder.project_start_date, // จำนวนที่จองใน zone
        ]);
        connection.query(insertOrderZoneQuery, [orderZoneValues], (error) => {
          if (error) {
            return resolve(error);
          }
          // res.json({ message: 'Order and zone_book inserted successfully' });
          resolve({
            message: "Order created successfully",
            id: results.insertId,
            status: true,
          });
        });

        // resolve({
        //   message: "Order created successfully",
        //   id: results.insertId,
        //   status: true,
        // });
      });
    });
  },
  onStoreOrderZone(zone_book) {},
  isOrderNoUnique(orderNo) {
    return new Promise((resolve, reject) => {
      const query = `SELECT COUNT(*) AS count FROM ${table} WHERE order_no = ?`;
      connection.query(query, [orderNo], (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results[0].count === 0);
      });
    });
  },
  async createOrder() {
    const orderNo = uuidv4().split("-")[0].toUpperCase();
    while (!(await this.isOrderNoUnique(orderNo))) {
      orderNo = uuidv4();
    }
    return orderNo;
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

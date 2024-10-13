const connection = require("../config/database");
const date_and_time = require("date-and-time");
const table = "tb_orders";
const table_zone = "tb_zone";
const table_order_zone = "tb_order_zone";
const table_order_product = "tb_order_product";
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

module.exports = {
  onCheckZoneOnDate(zone_id, date_book) {
    return new Promise((resolve, reject) => {
      date_book = date_and_time.format(new Date(date_book), "YYYY-MM-DD");
      let sql = `SELECT COUNT(*) AS 'isEmpty'
      FROM ${table} o
      JOIN ${table_order_zone} oz ON o.id = oz.order_id
      WHERE oz.zone_id = ?
      AND DATE(o.project_start_date) = ?;`;
      connection.query(sql, [zone_id, date_book], (err, results) => {
        if (err) {
          return reject({
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
      SELECT orders.*,or_zone.*,zone.name  FROM ${table_order_zone} or_zone
	      LEFT JOIN ${table} orders ON orders.id = or_zone.order_id 
		      LEFT JOIN ${table_zone} zone ON zone.id = or_zone.zone_id  ORDER BY zone.name DESC
      `;
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
  onStore(newOrder, product_book, zone_book) {
    return new Promise(async (resolve, reject) => {
      // Insert into tb_orders
      let sql = `INSERT INTO ${table} SET ?`;
      connection.query(sql, [newOrder], (err, results) => {
        if (err) {
          return reject({
            status: false,
            message: "Database error during order creation",
            error: err,
          });
        }

        const orderId = results.insertId;

        // Prepare data for tb_order_product
        const orderProductValues = product_book.map((product) => [
          orderId, // order_id ที่เพิ่ง insert
          product.product_id, // product_id
          product.quantity, // จำนวนที่จองใน product
        ]);
        const insertOrderProductQuery = `INSERT INTO ${table_order_product} (order_id, product_id, quantity) VALUES ?`;

        // Insert into tb_order_product
        connection.query(
          insertOrderProductQuery,
          [orderProductValues],
          (error) => {
            if (error) {
              return reject({
                status: false,
                message: "Database error during product insert",
                error: error,
              });
            }

            // Prepare data for tb_order_zone
            const orderZoneValues = zone_book.map((zone_id) => [
              orderId, // order_id ที่เพิ่ง insert
              zone_id, // zone_id
              newOrder.project_start_date, // project_start_date
            ]);
            const insertOrderZoneQuery = `INSERT INTO ${table_order_zone} (order_id, zone_id, project_start_date) VALUES ?`;

            // Insert into tb_order_zone
            connection.query(
              insertOrderZoneQuery,
              [orderZoneValues],
              (error) => {
                if (error) {
                  return reject({
                    status: false,
                    message: "Database error during zone insert",
                    error: error,
                  });
                }

                // Successful operation
                resolve({
                  message: "Order created successfully",
                  id: orderId,
                  status: true,
                });
              }
            );
          }
        );
      });
    });
  },

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
  onStoreProductOrder(products) {
    return Promise((resolve, reject) => {
      const sql = `INSERT INTO ${table_order_product}(order_id , product_id , quantity) VALUES ?`;
      connection.query(sql, [products], (error) => {
        if (error) {
          return resolve(error);
        }
        // res.json({ message: 'Order and zone_book inserted successfully' });
        resolve({
          status: true,
        });
      });
    });
  },
};

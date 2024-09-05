const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt_access_key = process.env.ACCESS_TOKEN_KEY;
const saltRounds = 10;

const security = {
  // middle ware check auth
  verifyToken(req, res, next) {
    // let user = {
    //   username: "system",
    //   password: "1234",
    //   role: "admin",
    // };

    // // If production remove here!
    // let token = jwt.sign(user, jwt_access_key, {
    //   expiresIn: "1d",
    // });

    let token = req.headers["authorization"];
    if (!token)
      return res
        .status(403)
        .json({ status: false, message: "Not authenticated." });
    token = token.replace("Bearer ", "");
    jwt.verify(token, jwt_access_key, (err, decoded) => {
      if (err) {
        return res.status(500).json({ status: false, message: err.message });
      }

      req.user = decoded;
      next();
    });
  },
  // hash password for store to database or for check compare with login page
  password_hash(password) {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  },
  // check role "admin" or "user"
  isInRole:
    (roles = []) =>
    (req, res, next) => {
      // let token = req.headers["authorization"]; // Get token on headers authorization

      // // Check token not empty
      // if (!token) {
      //   const error = {
      //     error: {
      //       message: "Not authenticated.",
      //     },
      //     status: 401,
      //   };
      //   return res.json(error);
      // }

      // token = token.replace("Bearer ", ""); //  Remove string word "Bearer " from token

      // // Verify token is valid or not
      // let decodedToken;
      // try {
      //   decodedToken = jwt.verify(token, jwt_access_key);
      // } catch (error) {
      //   let errors = {
      //     status: false,
      //     error: error,
      //   };
      //   return res.json(errors);
      // }

      // let user_role = decodedToken.role;
      let user_role = req.user.role;
      const authorized = roles.includes(user_role);

      if (!authorized) {
        const error = {
          error: {
            message: "Your role cannot use this acction.",
          },
          status: 401,
        };
        return res.json(error);
      }
      next();
    },
};

module.exports = security;

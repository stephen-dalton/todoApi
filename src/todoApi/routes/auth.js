const express = require("express");
const { body } = require("express-validator");

const router = express.Router();
const authController = require("../controllers/auth");
const isAuth = require("../middleware/isAuth");
const User = require("../models/user");

/**
 * HTTP GET Request
 * Endpoint Path /guarded
 * Returns Currently Logged in User
 */
router.get("/guarded", isAuth, authController.guarded);

/**
 * HTTP POST Request
 * Endpoint Path /signup
 * Creates a user account with supplied
 * email address and password.
 */
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            req.statusCode = 409;
            return Promise.reject("Account Already Exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password needs to be minimum 5 characters long"),
  ],
  authController.signUp
);

/**
 * HTTP POST Request
 * Endpoint Path /login
 * Logs in user and returns
 * JWT for future usage.
 */
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (!user) {
            return Promise.reject(
              "Account Does Not Exist. Please Create An Account."
            );
          }
        });
      })
      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password needs to be minimum 5 characters long"),
  ],
  authController.login
);

module.exports = router;

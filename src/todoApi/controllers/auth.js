const { validationResult } = require("express-validator");
const User = require("../models/user");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * The JWT_SECRET_TOKEN is used to create a user's access session token.
 *
 * If the token leaks then a threat/bad actor could impersonate any user.
 *
 * JSON Web Tokens were used to allow user authentication that only the server
 * can decrypt.
 *
 * We use the JWT_SECRET_TOKEN environment variable to prevent a user running
 * this application in production and remove the possibility that
 * a secret key was not configured.
 */

const { JWT_SECRET_TOKEN } = process.env;

exports.signUp = async (req, res, next) => {
  /**
   * Create a user with email & password.
   */
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed. Entered Incorrect Value");
    req.statusCode === 409
      ? (error.statusCode = 409)
      : (error.statusCode = 422);
    error.data = errors.array();
    return next(error);
  }
  try {
    const { email, password } = req.body;
    const hashedPassword = await argon2.hash(password);
    const newUser = new User({
      email: email,
      password: hashedPassword,
      todos: [],
    });
    await newUser.save({ timestamps: true });
    res
      .status(201)
      .json({ message: "Successfully Signed Up", _id: newUser._id });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode === 500;
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  /**
   * Login User with email & password.
   * Return JWT
   */
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed. Entered Incorrect Value");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  try {
    const { email, password } = req.body;
    const userToLogin = await User.findOne({ email: email });

    const isCorrectPassword = await argon2.verify(
      userToLogin.password,
      password
    );

    if (isCorrectPassword) {
      const token = jwt.sign({ userId: userToLogin._id }, JWT_SECRET_TOKEN, {
        expiresIn: "7 days",
      });
      userToLogin.token = token;
      await userToLogin.save();
      res.status(200).json({ accessToken: token });
    } else {
      const error = new Error("Incorrect Email or Password!");
      error.statusCode = 401;
      throw error;
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode === 500;
    }
    next(error);
  }
};

exports.guarded = async (req, res, next) => {
  /**
   * Return current logged in user's email.
   */
  const { userId } = req;
  const user = await User.findOne({ userId });
  if (!user) {
    const error = new Error(`Could not find user with that email`);
    error.statusCode = 404;
    throw error;
  }
  res.status(200).json({ loggedInAs: user.email });
};

const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { JWT_SECRET_TOKEN } = process.env;

exports.signUp = async (req, res, next) => {
  // Handle validation errors
  // Validation Error Handling
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed. Entered Incorrect Value");
    req.statusCode === 409
      ? (error.statusCode = 409)
      : (error.statusCode = 422);
    error.data = errors.array();
    return next(error);
  }

  try {
    // Get Request Body Parameters

    const { email, password } = req.body;
    // encrypt password

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const newUser = new User({
      email: email,
      password: hashedPassword,
      todos: [],
    });

    // save user to database
    await newUser.save({ timestamps: true });

    // confirm user sign up.
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
  // Handle validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed. Entered Incorrect Value");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  try {
    // Gather request Parameters
    const { email, password } = req.body;

    // Compare password with stored password
    const userToLogin = await User.findOne({ email: email });

    const isCorrectPassword = await bcrypt.compare(
      password,
      userToLogin.password
    );
    if (isCorrectPassword) {
      // Create jwt
      const token = jwt.sign({ userId: userToLogin._id }, JWT_SECRET_TOKEN, {
        expiresIn: "7 days",
      });

      userToLogin.token = token;
      await userToLogin.save();

      // Return jwt
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

exports.user = async (req, res, next) => {
  const { userId } = req;

  const user = await User.findOne({ userId });

  // Check if user exists
  if (!user) {
    const error = new Error(`Could not find user with that email`);
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({ loggedInAs: user.email });
};
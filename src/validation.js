import { body, validationResult,query } from "express-validator";
import { ApiResponse } from "./utils/ApiResponse.js";
// can be used for both signup and login because the login sends only email and password and the signup too
export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .trim()
    .notEmpty()
    .escape(),
  body("password")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Password cannot be empty"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// used for createUser validation

export const createUserValidator = [
  body("username")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("username cant be empty")
    .escape(),
  body("description")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("password cant be empty")
    .escape(),
  body("fullname")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("password cant be empty")
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { errors: errors.array() },
            "field missing or invalid"
          )
        );
    }
    next();
  },
];


export const searchValidators = [
    query("title").isString().trim().notEmpty().withMessage("search term can not be empty"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(400)
            .json(
              new ApiResponse(
                400,
                { errors: errors.array() },
                "field missing or invalid"
              )
            );
        }
        next();
      },
]

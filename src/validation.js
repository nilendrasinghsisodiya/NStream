import { body, validationResult, query } from "express-validator";
import { ApiResponse } from "./utils/ApiResponse.js";
import { updateAccountDetails } from "./controllers/user.controller.js";
import { ApiError } from "./utils/ApiError.js";
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
export const signUpValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .trim()
    .notEmpty().normalizeEmail()
    .escape(),
  body("password")
    .isString()
    .trim()
    .escape()
    .notEmpty().isLength({min:8})
    .withMessage("Password cannot be empty or shoter than 8 characters"),
  body("username")
    .isString()
    .trim()
    .notEmpty()
    .escape()
    .withMessage("Username can not be  empty"),

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
  body("description")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("description cant be empty")
    .escape(),
  body("fullname")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("fullname cant be empty")
    .escape(),
  body("avatar").custom((req)=>{
    if(!req.file){
      throw new ApiError(400,"avatar is required");
    }

    if(!["image/png", "image/jpeg","image/webp" ].includes(req.file.mimetype)){
      throw new ApiError(400,"unsupported file type provided");
    }

    if(req.file.size > 5 * 1024 * 1024){
      throw new ApiError(400,"only images upto 5MB are allowed");
    }

    return true;
  }),

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
  query("title")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("search term can not be empty"),
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


const videoUploadValidtors = [
body("title").isString().trim().notEmpty().escape(),
body("tags").isArray().optional(),

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



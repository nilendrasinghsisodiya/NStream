import { query, body } from "express-validator";
import { validate } from "../utils/additionalUtils.js";
import { isValidObjectId } from "mongoose";

// Validator to check valid Mongo ObjectId in query params
const checkValidObjectIdQuery = (fieldName) =>
  query(fieldName)
    .notEmpty().withMessage(`${fieldName} is required`)
    .bail()
    .custom((value) => isValidObjectId(value))
    .withMessage(`Invalid ${fieldName}`);

// Validator to check valid Mongo ObjectId in body params
const checkValidObjectIdBody = (fieldName) =>
  body(fieldName)
    .notEmpty().withMessage(`${fieldName} is required`)
    .bail()
    .custom((value) => isValidObjectId(value))
    .withMessage(`Invalid ${fieldName}`);

// Validators

const getVideoCommentsValidator = [
  checkValidObjectIdQuery("videoId"),
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1 }).withMessage("limit must be a positive integer"),
  query("sortBy")
    .optional()
    .isString().withMessage("sortBy must be a string"),
  query("sortType")
    .optional()
    .isIn(["asc", "desc"]).withMessage("sortType must be 'asc' or 'desc'"),
  validate,
];

const addCommentValidator = [
  checkValidObjectIdBody("videoId"),
  body("content")
    .notEmpty().withMessage("content is required")
    .isString().withMessage("content must be a string"),
  validate,
];

const updateCommentValidator = [
  checkValidObjectIdBody("commentId"),
  checkValidObjectIdBody("videoId"),
  body("content")
    .notEmpty().withMessage("content is required")
    .isString().withMessage("content must be a string"),
  validate,
];

const deleteCommentValidator = [
  checkValidObjectIdQuery("commentId"),
  validate,
];

const getRepliesValidator = [
  checkValidObjectIdQuery("commentId"),
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1 }).withMessage("limit must be a positive integer"),
  validate,
];

const addReplyValidator = [
  checkValidObjectIdBody("videoId"),
  checkValidObjectIdBody("commentId"),
  body("content")
    .notEmpty().withMessage("content is required")
    .isString().withMessage("content must be a string"),
  validate,
];

export {
  getVideoCommentsValidator,
  addCommentValidator,
  updateCommentValidator,
  deleteCommentValidator,
  getRepliesValidator,
  addReplyValidator,
};

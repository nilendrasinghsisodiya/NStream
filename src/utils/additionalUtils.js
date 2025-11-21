// this a one time use function create for bulk updates in documents in mongoDb existing documents use with caution.
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { validationResult } from "express-validator";

export const updateManyFieldsInDoc = (modal, filter, query) => {
  modal
    .updateMany(filter, query)
    .then(() => {
      console.log("bulk model updation successfull");
    })
    .catch((err) => console.log(err.message));
};

export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Middleware to check for validation errors and throw ApiError
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors nicely
    const extractedErrors = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));
    throw new ApiError(400, "Validation failed", extractedErrors);
  }
  next();
};

export const generateOtp = () => {
  // generates a random number between 100000 and 999999;
  return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
export const mongodbId = (id) => {
  return new mongoose.Types.ObjectId(id);
};

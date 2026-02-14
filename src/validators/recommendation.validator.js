import { query, body } from 'express-validator';
import { validate } from '../utils/additionalUtils.js';
import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId } from 'mongoose';

// Custom validator helper
const checkValidObjectId = (fieldName) => {
  return query(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .bail()
    .custom((value) => isValidObjectId(value))
    .withMessage(`Invalid ${fieldName}`);
};

// getUserRecommendation has no required input validation as it's based on req.user

const getRelatedVideosValidator = [
  checkValidObjectId('videoId'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('limit must be a positive integer'),
  validate,
];

const getPopularVideosValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('limit must be a positive integer'),
  validate,
];

const getSubscribedVideosValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('limit must be a positive integer'),
  validate,
];

export { getRelatedVideosValidator, getPopularVideosValidator, getSubscribedVideosValidator };

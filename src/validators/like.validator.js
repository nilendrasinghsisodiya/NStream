import { body } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
import { validate } from '../utils/additionalUtils.js';
import { isValidObjectId } from 'mongoose';

const toggleVideoLikeValidator = [
  body('videoId')
    .notEmpty()
    .withMessage('videoId is required')
    .bail()
    .custom((value) => isValidObjectId(value))
    .withMessage('Invalid videoId'),
  validate,
];

const toggleCommentLikeValidator = [
  body('targetId')
    .notEmpty()
    .withMessage('targetId is required')
    .bail()
    .custom((value) => isValidObjectId(value))
    .withMessage('Invalid targetId'),
  validate,
];

export { toggleVideoLikeValidator, toggleCommentLikeValidator };

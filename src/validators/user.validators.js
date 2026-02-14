import { body, validationResult, query } from 'express-validator';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { allowedImageType } from '../constants.js';
import { restructureValidationErrors, validate } from '../utils/additionalUtils.js';
// can be used for both signup and login because the login sends only email and password and the signup too
export const loginValidator = [
  body('email').isEmail().withMessage('Invalid email format').trim().notEmpty().escape(),
  body('password').isString().trim().notEmpty().withMessage('Password cannot be empty'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const restructredErrors = restructureValidationErrors(errors);
      return res.status(400).json({ errors: restructredErrors });
    }
    next();
  },
];
export const signUpValidator = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .trim()
    .notEmpty()
    .normalizeEmail()
    .escape(),
  body('password')
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password cannot be empty or shoter than 8 characters'),
  body('username').isString().trim().notEmpty().escape().withMessage('Username can not be  empty'),

  validate,
];

export const createUserValidator = [
  body('description')
    .exists()
    .withMessage('description is required')
    .bail()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('description cant be empty')
    .escape(),
  body('fullname')
    .exists()
    .withMessage('fullname is required')
    .bail()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('fullname cant be empty')
    .escape(),
  body('avatar').custom((_, { req }) => {
    if (!req.file) {
      throw new ApiError(400, 'avatar is required');
    }

    if (!allowedImageType.includes(req.file.mimetype)) {
      throw new ApiError(400, 'unsupported file minetype provided');
    }

    if (req.file.size > 5 * 1024 * 1024) {
      throw new ApiError(400, 'only images upto 5MB are allowed');
    }

    return true;
  }),

  (req, res, next) => {
    console.log('body', req.body);
    console.log('files', req.file);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const restructredErrors = restructureValidationErrors(errors);
      return res
        .status(400)
        .json(new ApiResponse(400, { errors: restructredErrors }, 'wrong input fields'));
    }
    next();
  },
];

export const changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  validate,
];

// Update account details (at least one required)
export const updateAccountDetailsValidator = [
  body('fullname').optional().isString(),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('description').optional().isString(),
  // Custom validator to check at least one field present
  (req, res, next) => {
    if (!req.body.fullname && !req.body.email && !req.body.description) {
      return res.status(400).json({ message: 'At least one field must be provided' });
    }
    next();
  },
  validate,
];

// Search users query params
export const searchUsersValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  query('query').optional().isString(),

  validate,
];

// Toggle subscribe
export const toggleSubscribeValidator = [
  body('targetId').notEmpty().withMessage('targetId is required').isMongoId(),
  validate,
];

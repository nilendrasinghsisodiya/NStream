import { body, validationResult, query } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
import { allowedImageType, allowedVideoType, sortBy, sortType } from '../constants.js';
import { validate } from '../utils/additionalUtils.js';

export const videoUploadValidtors = [
  body('title').isString().trim().notEmpty().escape(),
  body('tags.*').optional().trim().escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'field missing or invalid', errors.array());
    }
    if (res.files) {
      if (!res.files.videoFile[0]) {
        throw new ApiError(400, 'video file missing');
      } else {
        if (!allowedVideoType.includes(res.files.videoFile[0].minetype)) {
          throw new ApiError(400, 'video minetype not supported');
        }
      }

      if (!res.files.thumbnail[0]) {
        throw new ApiError(400, 'video thumbnail missing');
      } else {
        if (!allowedImageType.includes(res.files.thumbnail[0].minetype)) {
          throw new ApiError(400, 'video minetype not supported');
        }
      }
    } else {
      throw new ApiError(400, 'missing files');
    }

    next();
  },
];

export const searchValidators = [
  query('title').isString().trim().notEmpty().withMessage('search term can not be empty'),
  query('type')
    .isString()
    .trim()
    .escape()
    .custom((e) => {
      if (e === 'vids') {
        throw new ApiError(400, 'invalid type filter accepted value "vids"');
      }
      return true;
    }),
  query('sortType')
    .isString()
    .trim()
    .escape()
    .custom((value) => {
      if (!sortType.includes(value)) {
        throw new ApiError(400, 'invalid sortType filter accepted values "asc" & "desc"');
      }
      return true;
    }),
  query('sortBy')
    .isString()
    .trim()
    .escape()
    .custom((value) => {
      if (!sortBy.includes(value)) {
        throw new ApiError(400, 'invalid sortBy filter');
      }
      return true;
    }),
  validate,
];

// Middleware to validate getVideoById query param
export const validateGetVideoById = [
  query('videoId')
    .exists()
    .withMessage('videoId is required')
    .isMongoId()
    .withMessage('Invalid videoId'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

// Middleware to validate updateVideo body
export const validateUpdateVideo = [
  body('videoId').exists().withMessage('videoId is required').isMongoId().escape(),
  body('title').optional().isString().trim().escape(),
  body('tags').optional().isArray().escape(),
  validate,
];

// Middleware to validate deleteVideo query param
export const validateDeleteVideo = [
  query('videoId').exists().withMessage('videoId is required').isMongoId().escape(),
  validate,
];

// Middleware to validate togglePublishStatus body
export const validateTogglePublishStatus = [
  body('videoId').exists().withMessage('videoId is required').isMongoId().escape(),
  validate,
];

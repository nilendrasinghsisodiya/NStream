import { query, validationResult } from 'express-validator';

export const getChannelVideosValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'views', 'likesCount', 'duration'])
    .withMessage('Invalid sortBy field'),
  query('sortType')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("sortType must be 'asc' or 'desc'"),
  query('username').notEmpty().withMessage('Username is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

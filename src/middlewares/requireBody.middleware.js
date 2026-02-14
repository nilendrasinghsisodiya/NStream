import { ApiError } from '../utils/ApiError.js';
export function requireBody(req, res, next) {
  if (req.body === undefined) {
    throw new ApiError(400, 'A Request body is required');
  }
  next();
}

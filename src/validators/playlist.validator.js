import { body, query} from "express-validator"
import {validate} from "../utils/additionalUtils.js"
import { isValidObjectId } from "mongoose";


// Validator for creating playlist
const createPlaylistValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Playlist name is required")
    .isLength({ max: 100 }).withMessage("Playlist name must be at most 100 characters"),
  
  body("description")
    .trim()
    .notEmpty().withMessage("Playlist description is required")
    .isLength({ max: 500 }).withMessage("Description must be at most 500 characters"),
  
  validate,
];

// Validator for getPlaylistById (query params)
const getPlaylistByIdValidator = [
  query("playlistId")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid playlistId"),
  
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  
  validate,
];

// Validator for addVideoToPlaylist
const addVideoToPlaylistValidator = [
  body("playlistId")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid playlistId"),
  
  body("videoIds")
    .isArray({ min: 1 }).withMessage("videoIds must be a non-empty array"),
  
  body("videoIds.*")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid videoId in videoIds array"),
  
  validate,
];

// Validator for removeVideoFromPlaylist
const removeVideoFromPlaylistValidator = [
  body("playlistId")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid playlistId"),
  
  body("videoId")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid videoId"),
  
  validate,
];

// Validator for deletePlaylist
const deletePlaylistValidator = [
  body("playlistId")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid playlistId"),
  
  validate,
];

// Validator for updatePlaylist
const updatePlaylistValidator = [
  body("playlistId")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid playlistId"),
  
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Name cannot be empty if provided")
    .isLength({ max: 100 }).withMessage("Name max length is 100"),
  
  body("description")
    .optional()
    .trim()
    .notEmpty().withMessage("Description cannot be empty if provided")
    .isLength({ max: 500 }).withMessage("Description max length is 500"),
  
  validate,
];

export {
  createPlaylistValidator,
  getPlaylistByIdValidator,
  addVideoToPlaylistValidator,
  removeVideoFromPlaylistValidator,
  deletePlaylistValidator,
  updatePlaylistValidator,
};

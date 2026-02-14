import mongoose, { Schema } from 'mongoose';

const likeSchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      index: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      index: true,
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);
likeSchema.indexes([]);
export const Like = mongoose.model('Like', likeSchema);

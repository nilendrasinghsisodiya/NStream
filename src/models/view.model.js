import mongoose from 'mongoose';

const viewSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24, // 1 day in seconds
    },
  },
  {
    timestamps: true, // creates createdAt and updatedAt (for auditing)
  },
);

viewSchema.index({ ip: 1, video: 1, user: 1, createdAt: 1 });

const View = mongoose.model('View', viewSchema);

const presisitViewSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    channelViewed: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    viewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

const PresistView = mongoose.model('PresistView', presisitViewSchema);

export { View, PresistView };

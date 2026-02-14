import { mongoose, Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    view: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

playlistSchema.methods.isOwner = function (userId) {
  return String(this.owner) === String(userId);
};
playlistSchema.plugin(mongooseAggregatePaginate);
export const Playlist = mongoose.model('Playlist', playlistSchema);

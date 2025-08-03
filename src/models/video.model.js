import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloud url
      required: true,
    },
    thumbnail: {
      type: String, //cloud rul
      required: true,
    },
    title: {
      type: String,
      required: true,
      index:true
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, //cloud content info
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    videoFilePublicId: {
      type: String,
      required: true
    },
    thumbnailPublicId:{
      type: String,
      required: true
    },
    tags:{
      type:[String],
      
    },
    likesCount:{
      type:Number,
      default:0,
    }
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate);
videoSchema.methods.isOwner = function(userId){
 return String(userId) === String(this.owner._id);
}

export const Video = mongoose.model("Video", videoSchema);

import mongoose,{  Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    comment:{
      type:Schema.Types.ObjectId,
      ref:"Comment"
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);
commentSchema.methods.isOwner = function (userId) {
  return String(this.owner) === String(userId);
};
export const Comment = mongoose.model("Comment", commentSchema);

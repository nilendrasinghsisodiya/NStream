import {Mongoose, Schema} from "mongoose";

const playlistSchema = new Schema({
    name :{
        type: String,
        required: true
    },
    description: String,
    vidoes:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

export const Playlist = Mongoose.model("Playlist",playlistSchema);
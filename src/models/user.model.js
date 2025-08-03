import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      
      trim: true,
      
    },
    avatar: {
      type: String, //cloud url
     
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String, // needs to encrypt and decrypted
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
    avatarPublicId: {
      type: String,
     
    },
    coverImagePublicId: {
      type: String,
     
    },
    recentlyWatchedVideoTags: [{ type: String}],
    subscribersCount:{
      type:Number,
      default:0,
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  console.log("🔹 Running pre-save hook for:", this.email);

  if (!this.isModified("password")) {
    console.log(" Password not modified, skipping hashing.");
    return next();
  }

  console.log("Password Before Hashing:", this.password);
  this.password = await bcrypt.hash(this.password, 10);
  console.log("Hashed Password:", this.password);
  
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  console.log("Entered Password:", password);
  console.log("Stored Hashed Password:", this.password);
 

  const result = await bcrypt.compare(password, this.password);
  console.log("Password Match Result:", result);
  
  return result;
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email, // payload object
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // option object
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id, //payload object
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      // options object
    }
  );
};

export const User = mongoose.model("User", userSchema);

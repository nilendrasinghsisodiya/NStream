import mongoose from "mongoose"

const subscriptionSchema = new mongoose.Schema({
subscriber:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
},
channel: {

    type: mongoose.Schema.Types.ObjectId,
    ref: "User"

}
},{timestamps:true});

export  const Subscription = mongoose.model("subscription", subscriptionSchema);
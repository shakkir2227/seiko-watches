import mongoose, { Mongoose, Schema } from "mongoose";

const addressSchema = new Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    pincode: {
        type: Number,
        required: true,
    },
    houseName: {
        type: String,
        required: true,
    },
    area: {
        type: String,
        required: true,
    },
    landmark: {
        type: String,
        required: true,
    },
    town: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },

})

export const Address = mongoose.model("Address", addressSchema)
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const OTPSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,

    },
    OTP: {
        type: String,
        required: true
    },

}, {
    timestamps: true
})

OTPSchema.pre("save", async function (next) {
    if (!this.isModified("OTP")) return next();

    this.OTP = await bcrypt.hash(this.OTP, 10);
    next(); 
})

OTPSchema.methods.isOTPCorrect = async function (OTP) {
    return await bcrypt.compare(OTP, this.OTP)
}


export const OTP = mongoose.model("OTP", OTPSchema)
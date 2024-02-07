import mongoose, { Mongoose, Schema } from "mongoose";

const couponSchema = new Schema({
    code: {
        type: String,
        required: true
    },
    discountPercent: {
        type: Number,
        required: true
    },
    minimumOrderAmount: {
        type: Number,
        required: true
    },
    maxDiscountAmount: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    }

})

export const Coupon = mongoose.model("Coupon", couponSchema)
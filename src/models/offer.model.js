import mongoose, { Mongoose, Schema } from "mongoose";


const offerSchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId, ref: "Product",
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, ref: "Category",
    },
    discountPercent: {
        type: Number,
        required: true
    },
    maxDiscountAmount: {
        type: Number,
        required: true
    },
   
}, {
    timestamps: true
})


export const Offer = mongoose.model("Offer", offerSchema)
import mongoose, { Mongoose, Schema } from "mongoose";

const orderSchema = new Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    address: {
        type: mongoose.Types.ObjectId,
        ref: "Address"
    },
    productDetails: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", },
        quantity: { type: Number },
        deliveryStatus: { type: String, default: "Processing" }
    }],
    totalAmount: {
        type: Number,
    },
    paymentMethod: {
        type: String,
        enum: ["Cash on delivery", "Pay online",],
    },
    paymentStatus: {
        type: String,
        default:"nil",
        enum: ["Pending", "Successful", "Failed", "Refunded", "nil"],
    },
    paymentId: {
        type: String,
        default: "nil"
    }
}, {
    timestamps: true,
})


export const Order = mongoose.model("Order", orderSchema)

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
        price: { type: Number },
        deliveryStatus: {
            type: String,
            enum: ["Confirmed", "Shipped", "Our For Delivery", "Delivered", "Cancelled", "Returned"],
            default: "Confirmed"
        }
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
        default: "nil",
        enum: ["Pending", "Successful", "Failed", "Refunded", "nil"],
    },
    paymentId: {
        type: String,
        default: "nil"
    },
    discountAmount: {
        type: Number,
    }
}, {
    timestamps: true,
})


export const Order = mongoose.model("Order", orderSchema)

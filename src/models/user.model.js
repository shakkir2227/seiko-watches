import mongoose, { Mongoose, Schema, mongo } from "mongoose";
import bcrypt from "bcrypt";



const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        required: true,
        default: false
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", },
        quantity: { type: Number, default: 1 }
    }],

    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],

    coupons: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", },
    ],

    wallet: {
        type: Number,
        default: 0
    },

    referalLink: {
        type: String,
    }

}, {
    timestamps: true
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)


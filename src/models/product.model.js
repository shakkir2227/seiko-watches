import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
    
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true,
    },

    images: [
        {
            url: String,

        }
    ],

    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    
    price: {
        type: Number,
        default: 0,
    },

    stock: {
        type: Number,
        default: 0
    },


    bandMaterial: {
        type: String,
        enum: ["Leather", "Metal", "Titanium"],
        required: true,
    },

    dialColor: {
        type: String,
        enum: ["Black", "Blue", "Brown"],
    },

    isBlocked: {
        type: Boolean,
        default: false,
    },
    offer: {
        type: Schema.Types.ObjectId,
        ref: "Category",
    }

}, {
    timestamps: true,
}

)

export const Product = mongoose.model("Product", productSchema);
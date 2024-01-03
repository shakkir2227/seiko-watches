import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
    name: {
        type: String,
        requried: true,
        trim: true,
    },
    parentCategoryId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        requried: true,
        default: null,

    },
    isBlocked: {
        type: Boolean,
        requried: true,
        default: false,
    }

}, {
    timestamps: true,
})

export const Category = mongoose.model("Category", categorySchema);
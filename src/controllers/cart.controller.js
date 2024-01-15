import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";

const addToCartController = asyncHandler(async (req, res) => {

    const user = res.locals.user;
    if (!user) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
    const product = req.body.productId;
    const quantity = req.body.productQuantity;

    user.cart.push({
        product,
        quantity
    })

    await user.save();
    return res.status(200).json({ message: "Added to cart successfully" })
})

const viewCartController = asyncHandler(async (req, res) => {

    const { userId } = req.session
    const userIdObject = new mongoose.Types.ObjectId(userId)
    const user = await User.findOne({ _id: userId })

    const userCart = await User.aggregate(
        [
            { $match: { _id: userIdObject } },
            {
                $unwind: "$cart"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "cart.product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $addFields: {
                    subTotal: {
                        $multiply: ['$cart.quantity', { $arrayElemAt: ["$product.price", 0] }]
                    },
                },
            },
        ]
    );

    return res.render("shop-cart.ejs", { categories: res.locals.categories, userCart })
})


const updateCartController = asyncHandler(async (req, res) => {
    const { productId, quantity, todo } = req.body

    // Accoding to the message changing the quantity
    let updatedQuantity = (todo === 'increase') ? quantity + 1 : (quantity > 1) ? quantity - 1 : 1;

    // Finding the specific user
    const user = res.locals.user;

    // Updating the quantity of the product.
    await User.updateOne({ _id: user._id, "cart.product": productId }, { $set: { "cart.$.quantity": updatedQuantity } })
    return res.status(200).json(updatedQuantity)
})

const deleteFromCartController = asyncHandler(async (req, res) => {
    const { productId } = req.body
    const user = res.locals.user;
    await User.updateOne({ _id: user._id }, { $pull: { cart: { product: productId } } })
    return res.status(200).json("Item removed from cart")
})


export {
    addToCartController,
    viewCartController,
    updateCartController,
    deleteFromCartController
}
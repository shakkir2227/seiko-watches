import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const userCheckoutController = {

    renderCheckoutPage: asyncHandler(async(req, res) => {

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

        console.log(userCart);

        return res.render("shop-checkout.ejs",{categories: res.locals.categories, userCart})
    })
}

export {
    userCheckoutController
}
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { Order } from "../models/order.model.js";
import addressValidationSchema from "../utils/validation/address.validation.js"
import mongoose from "mongoose";

const userCheckoutController = {

    renderCheckoutPage: asyncHandler(async (req, res) => {

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

        const userDefaultAddress = await Address.aggregate([
            {
                $match: {
                    user: userIdObject,
                    isDefault: true
                }
            }
        ])

        const userAddresses = await Address.aggregate([
            {
                $match: {
                    user: userIdObject,
                    isDefault: false
                }
            }
        ])



        return res.render("shop-checkout.ejs", { categories: res.locals.categories, userCart, userDefaultAddress, userAddresses })
    }),

    addAddress: asyncHandler(async (req, res) => {
        const user = res.locals.user;

        const { name, mobileNumber, pincode, houseName, area, landmark, town, state } = req.body

        const { error } = addressValidationSchema.validate({ name, mobileNumber, pincode, houseName, area, landmark, town, state })
        if (error) {
            req.flash("error", `${error.message}`);
            return res.status(500).json(error.message)
        }

        // Removing the current default address 
        // adding the new address as default

        await Address.updateOne({ user: user._id, isDefault: true }, { $set: { isDefault: false } })

        const userAddress = await Address.create({
            user: user._id,
            name,
            mobileNumber,
            pincode,
            houseName,
            area,
            landmark,
            town,
            state,
            isDefault: true,
        })

        if (!userAddress) {
            req.flash("error", "Adding new address failed")
            return res.status(500).json(error.message)
        }

        return res.status(200).json(userAddress)
    }),

    createOrder: asyncHandler(async (req, res) => {
        const user = res.locals.user
        console.log(req.body);
        let { selectedAddressIndex, productDetails, totalAmount, paymentMethod } = req.body
        if (!selectedAddressIndex) {
            selectedAddressIndex = await Address.findOne({ user: user._id, isDefault: true })
        }

        const order = await Order.create({
            user: user._id,
            address: selectedAddressIndex,
            productDetails,
            totalAmount,
            paymentMethod,

        })

        return res.status(200).json({message: "Your order has been placed successfully. Thank you for choosing our service."})

    })
}

export {
    userCheckoutController
}
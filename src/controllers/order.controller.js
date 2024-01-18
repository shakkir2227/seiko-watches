import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import addressValidationSchema from "../utils/validation/address.validation.js"
import mongoose from "mongoose";

const userCheckoutController = {

    renderCheckoutPage: asyncHandler(async (req, res) => {

        const { userId } = req.session;
        const userIdObject = new mongoose.Types.ObjectId(userId)

        // Finding user's default address and other saved addresses
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


        // When user buys single product, we get productid and qty
        // from query params 
        const { productId, productQuantity } = req.query;
        const productIdObject = new mongoose.Types.ObjectId(productId)

        if (productId && productQuantity) {
            const product = await Product.aggregate([
                {
                    $match: {
                        _id: productIdObject
                    }
                },
            ])

            const subTotal = product[0].price * productQuantity

            return res.render("shop-checkout.ejs", { categories: res.locals.categories, product, productQuantity, subTotal, userDefaultAddress, userAddresses })
        }




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

        return res.status(200).json({ message: "Your order has been placed successfully. Thank you for choosing our service." })

    })
}

const userOrderViewController = asyncHandler(async (req, res) => {

    const user = res.locals.user

    const userOrders = await Order.aggregate([
        { $match: { user: user._id } },
        { $unwind: "$productDetails" },
        { $lookup: { from: "products", localField: "productDetails.product", foreignField: "_id", as: "product" } },
        { $lookup: { from: "addresses", localField: "address", foreignField: "_id", as: "address" } },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                address: 1,
                productDetails: 1,
                product: 1,
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y",
                        date: "$createdAt"
                    }
                }
            }
        }

    ])

    return res.render("page-orders.ejs", { userOrders })
})

const userOrderDetailedViewController = asyncHandler(async (req, res) => {

    const { orderId, productId } = req.query;

    const orderIdObject = new mongoose.Types.ObjectId(orderId)
    const productIdObject = new mongoose.Types.ObjectId(productId)

    const order = await Order.aggregate([
        {
            $match: {
                _id: orderIdObject,
            }
        },
        {
            $unwind: "$productDetails"
        },
        {
            $match: {
                "productDetails.product": productIdObject
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
            }
        },
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "address"
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "productDetails.product",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $addFields: {
                subTotal: {
                    $multiply: ['$productDetails.quantity', { $arrayElemAt: ["$product.price", 0] }]
                }
            }
        },
        {
            $project: {
                user: 1,
                address: 1,
                productDetails: 1,
                paymentMethod: 1,
                paymentId: 1,
                product: 1,
                subTotal: 1,
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y %H:%M:%S",
                        date: "$createdAt",
                    }
                }
            }
        }


    ])

    console.log(order);
    return res.render("page-orders-tracking.ejs", { order })

})

const userOrderUpdateControler = {
    cancelOrder: asyncHandler(async (req, res) => {
        const { orderId, productId } = req.body;

        // converting to mongodb objectid
        const orderIdObject = new mongoose.Types.ObjectId(orderId)
        const productIdObject = new mongoose.Types.ObjectId(productId)

        await Order.updateOne(
            { _id: orderIdObject, "productDetails.product": productIdObject },
            { $set: { "productDetails.$.deliveryStatus": "Cancelled" } }
        )

        return res.status(200).json({ message: "Your order has been successfully canceled. If you have any further questions or concerns, please feel free to contact our customer support" })

    })
}

const adminOrderViewController = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const orderIdObject = new mongoose.Types.ObjectId(orderId)
    const order = await Order.aggregate([
        {
            $match: {
                _id: orderIdObject
            },

        },
        {
            $unwind: "$productDetails"
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "address",
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "productDetails.product",
                foreignField: "_id",
                as: "product",
            }
        },

        {
            $addFields: {
                subTotal: {
                    $multiply: ["$productDetails.quantity", { $arrayElemAt: ["$product.price", 0] }]
                }
            }
        },
        {
            $project: {
                user: 1,
                address: 1,
                productDetails: 1,
                product: 1,
                totalAmount: 1,
                paymentMethod: 1,
                paymentStatus: 1,
                paymentId: 1,
                subTotal: 1,
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y %H:%M:%S",
                        date: "$createdAt"
                    }
                }

            }
        }

    ])

    console.log(order);

    return res.render("page-orders-detail.ejs", { order })
})

const adminOrderDetailedViewController = asyncHandler(async (req, res) => {

    const { orderId, productId } = req.query;

    const orderIdObject = new mongoose.Types.ObjectId(orderId)
    const productIdObject = new mongoose.Types.ObjectId(productId)

    const order = await Order.aggregate([
        {
            $match: {
                _id: orderIdObject,
            }
        },
        {
            $unwind: "$productDetails"
        },
        {
            $match: {
                "productDetails.product": productIdObject
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
            }
        },
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "address"
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "productDetails.product",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $addFields: {
                subTotal: {
                    $multiply: ['$productDetails.quantity', { $arrayElemAt: ["$product.price", 0] }]
                }
            }
        },
        {
            $project: {
                user: 1,
                address: 1,
                productDetails: 1,
                paymentMethod: 1,
                paymentId: 1,
                product: 1,
                subTotal: 1,
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y %H:%M:%S",
                        date: "$createdAt",
                    }
                }
            }
        }


    ])

    console.log(order);
    return res.render("page-admin-orders-tracking.ejs", { order })

})

export {
    userCheckoutController,
    userOrderViewController,
    userOrderDetailedViewController,
    userOrderUpdateControler,
    adminOrderViewController,
    adminOrderDetailedViewController,
}
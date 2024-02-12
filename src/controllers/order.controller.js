import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import addressValidationSchema from "../utils/validation/address.validation.js"
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { Coupon } from "../models/coupon.model.js";

const userCheckoutController = {

    renderCheckoutPage: asyncHandler(async (req, res) => {

        const { userId } = req.session;
        const userIdObject = new mongoose.Types.ObjectId(userId)

        // Finding user's default address and other saved addresses
        const userDefaultAddress = await Address.aggregate([
            {
                $match: {
                    user: userIdObject,
                    isDefault: true,
                    isBlocked: false,
                }
            }
        ])




        const userAddresses = await Address.aggregate([
            {
                $match: {
                    user: userIdObject,
                    isDefault: false,
                    isBlocked: false,
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

            let subTotal;
            if (product[0].discountedPrice) {
                subTotal = product[0].discountedPrice * productQuantity
            } else {
                subTotal = product[0].price * productQuantity;
            }

            return res.render("shop-checkout.ejs", { categories: res.locals.categories, product, productQuantity, subTotal, userDefaultAddress, userAddresses })
        }


        // When user buy from cart, listing all cart items
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
                            $cond: {
                                if: {
                                    $eq: [{ $arrayElemAt: ["$product.discountedPrice", 0] }, null],
                                },
                                then: {
                                    $multiply: ['$cart.quantity', { $arrayElemAt: ["$product.price", 0] }],
                                },
                                else: {
                                    $multiply: ['$cart.quantity', { $arrayElemAt: ["$product.discountedPrice", 0] }],
                                }
                            }
                        }
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


    generateRazorPayOrderId: asyncHandler(async (req, res) => {

        const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
        const { productDetails, totalAmount } = req.body;

        console.log(req.body);

        // Before initiating the payment, reducing the stock of each of the products
        // Checking if the stock becomes negative, if it is, return an error. 
        for (const productDetail of productDetails) {
            const product = await Product.findOne({ _id: productDetail.product })
            product.stock -= productDetail.quantity;

            if (product.stock < 0) {
                return res.status(500).json({ message: "Sorry, the requested quantity is currently unavailable.!" })
            }
        }


        let instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
        const options = {
            amount: totalAmount * 100,
            currency: "INR",
        }

        instance.orders.create(
            options, (error, order) => {
                if (!error) {
                    return res.status(200).json({
                        success: true,
                        message: "Razor pay order created",
                        amount: totalAmount * 100,
                        key_id: RAZORPAY_KEY_ID,
                        order_id: order.id,

                    })
                }
                else {
                    console.log(error);
                }
            }
        )

    }),

    createOrder: asyncHandler(async (req, res) => {

        console.log(req.body);

        const user = res.locals.user;

        let { selectedAddressIndex, productDetails, totalAmount, paymentMethod, paymentId, discountAmount, appliedCoupon } = req.body;

        // Before creating the order, reducing the stock of each of the products
        // Checking if the stock becomes negative, if it is, return an error. 
        for (const productDetail of productDetails) {
            const product = await Product.findOne({ _id: productDetail.product })
            product.stock -= productDetail.quantity;

            if (product.stock < 0) {
                return res.status(500).json({ message: "We're sorry, but your order couldn't be completed due to insufficient stock. Please review your order and try again, or contact customer support for assistance." })
            }

            product.save();
        }

        // According to payment method, changing payment status
        let paymentStatus = paymentMethod === "Cash on delivery" ? "Pending" : "Successful"

        if (!selectedAddressIndex) {
            selectedAddressIndex = await Address.findOne({ user: user._id, isDefault: true })
        }
        const selectedAddressIndexIdObject = new mongoose.Types.ObjectId(selectedAddressIndex)

        // If no address selected by user throw error
        if (!selectedAddressIndex) {
            console.log("HERE");
            return res.status(400).json({ message: "Please select your preferred address for a seamless experience on our platform." })
        }



        // Finding the coupon to findout the discount percent, and include that in the order
        const coupon = await Coupon.aggregate([
            {
                $match: {
                    code: appliedCoupon
                }
            }
        ])

        // Converting discountAmount to integer
        discountAmount = discountAmount.replace(" - ₹", "")
        discountAmount = parseInt(discountAmount)

        console.log(productDetails);

        const order = await Order.create({
            user: user._id,
            address: selectedAddressIndexIdObject,
            productDetails,
            totalAmount,
            paymentMethod,
            paymentStatus,
            paymentId,
            discountAmount, // Saving the coupon
        })

        // Now adding this coupon to the user model
        if (coupon.length > 0) {
            await User.updateOne(
                {
                    _id: user._id
                },
                {
                    $push: {
                        coupons: coupon[0]._id
                    }
                }
            )
        }

        // Removing the specific number of products from the cart, if the user 
        // buy that in the current order, if the quantity in the cart becomes zero in 
        // this process, delete that product from cart. 
        for (const productDetail of productDetails) {
            await User.updateMany(
                { _id: user._id, "cart.product": productDetail.product },
                {
                    $inc: {
                        "cart.$.quantity": -productDetail.quantity
                    }
                }
            )
        }

        await User.updateMany(
            { _id: user._id },
            {
                $pull: {
                    "cart": { quantity: 0 }
                }
            }
        )

        return res.status(200).json({
            success: true,
            message: "Order placed",
        })

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
    console.log(userOrders);
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
                    $multiply: ["$productDetails.quantity", "$productDetails.price"]
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
                        timezone: "+05:30"
                    }
                }
            }
        }


    ])

    const orderStatistics = await Order.aggregate([
        {
            $unwind: "$productDetails"
        },
        {
            $addFields: {
                subTotal: {
                    $cond: {
                        if: {
                            $ne: ["$productDetails.deliveryStatus", "Cancelled"]
                        },
                        then: {
                            $multiply: ["$productDetails.quantity", "$productDetails.price"]
                        },
                        else: 0
                    }
                }
            }
        },
        {
            $project: {
                subTotal: 1,
            }
        }
    ])


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

        // When user cancel the order, increase the corresponding product's stock
        const cancelledProduct = await Order.aggregate([

            {
                $match: {
                    _id: orderIdObject
                },
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
                $project: {
                    productDetails: 1,
                    paymentMethod: 1,
                    discountAmount: 1,
                    totalAmount: 1,
                }
            }
        ])

        console.log("Cancelled product is ");
        console.log(cancelledProduct);

        const cancelledOrderProductCount = cancelledProduct[0].productDetails.quantity;

        const product = await Product.findOne({ _id: productIdObject });
        product.stock += cancelledOrderProductCount;

        await product.save()



        // First findingout the subtotal
        let subTotal = cancelledProduct[0].productDetails.quantity * cancelledProduct[0].productDetails.price

        let totalAmount = cancelledProduct[0].totalAmount + cancelledProduct[0].discountAmount
        let discountOfThisProduct = Math.ceil((subTotal / totalAmount) * cancelledProduct[0].discountAmount)

        subTotal = subTotal - discountOfThisProduct;

        // Updating the order with new discount amount in cash on delivery
        if (cancelledProduct[0].paymentMethod === "Cash on delivery") {
            await Order.updateOne(
                {
                    _id: orderIdObject
                },
                {
                    $inc: {
                        discountAmount: - discountOfThisProduct
                    }
                }
            )
        }


        // If it is online payment
        if (cancelledProduct[0].paymentMethod === "Pay online") {

            // If no coupon is applied by user, refunding the subtotal
            if (cancelledProduct[0].discountAmount === 0) {
                await User.updateOne(
                    {
                        _id: res.locals.user._id
                    },
                    {
                        $inc: {
                            wallet: subTotal
                        }
                    }
                )
            } else {

                // If user had used coupon, finding out this subtotal is how much percent
                // of the total order, then subtract that amount from subtotal and refund
                // Also update the order doc with new discount amount
                await User.updateOne(
                    {
                        _id: res.locals.user._id
                    },
                    {
                        $inc: {
                            wallet: subTotal
                        }
                    }
                )
            }

        }

        return res.status(200).json({ message: "Your order has been successfully cancelled. If you have any further questions or concerns, please feel free to contact our customer support" })

    }),


    returnOrder: asyncHandler(async (req, res) => {

        console.log(req.body);

        const { orderId, productId } = req.body;

        // converting to mongodb objectid
        const orderIdObject = new mongoose.Types.ObjectId(orderId)
        const productIdObject = new mongoose.Types.ObjectId(productId)

        await Order.updateOne(
            { _id: orderIdObject, "productDetails.product": productIdObject },
            { $set: { "productDetails.$.deliveryStatus": "Returned" } }
        )


        // When user return the order, increase the corresponding product's stock
        const returnedProduct = await Order.aggregate([

            {
                $match: {
                    _id: orderIdObject
                },
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
                $project: {
                    productDetails: 1,
                    paymentMethod: 1,
                    discountAmount: 1,
                    totalAmount: 1,
                }
            }
        ])

        console.log("Retruned product is ");
        console.log(returnedProduct);

        const returnedOrderProductCount = returnedProduct[0].productDetails.quantity;

        const product = await Product.findOne({ _id: productIdObject });
        product.stock += returnedOrderProductCount;

        await product.save()

        // First findingout the subtotal
        let subTotal = returnedProduct[0].productDetails.quantity * returnedProduct[0].productDetails.price

        let totalAmount = returnedProduct[0].totalAmount + returnedProduct[0].discountAmount
        let discountOfThisProduct = Math.ceil((subTotal / totalAmount) * returnedProduct[0].discountAmount)

        subTotal = subTotal - discountOfThisProduct;

        // This amount is credited to user's wallet
        await User.updateOne(
            {
                _id: res.locals.user._id
            },
            {
                $inc: {
                    wallet: subTotal
                }
            }
        )

        console.log("returned");

        return res.status(200).json({ message: "Your request for return has been successfully processed. Amount will be credited to your wallet shortly. If you have any further questions or concerns, please feel free to contact our customer support" })


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
        // If it is cash on delivery and product is cancelled, then subtotal set to zero
        // if it is online payment, then no changes
        {
            $addFields: {
                subTotal: {
                    $cond: {
                        if: {
                            $eq: ["$paymentMethod", "Pay online"]
                        },
                        then: {
                            $multiply: ["$productDetails.quantity", "$productDetails.price"]
                        },
                        else: {
                            $cond: {
                                if: {
                                    $ne: ["$productDetails.deliveryStatus", "Cancelled"]
                                },
                                then: {
                                    $multiply: ["$productDetails.quantity", "$productDetails.price"]
                                },
                                else: 0
                            }
                        }
                    }
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
                discountAmount: 1,
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
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: {
                            $ne: ["$totalAmount", 0]
                        },
                        then: {
                            $subtract: ["$totalAmount", "$discountAmount"]
                        },
                        else: "$totalAmount"
                    }

                }
            }
        },

    ])


    const orderStatistics = await Order.aggregate([
        {
            $match: {
                _id: orderIdObject
            },

        },
        {
            $unwind: "$productDetails"
        },
        // If it is cash on delivery and product is cancelled, then subtotal set to zero
        // if it is online payment, then no changes
        {
            $addFields: {
                subTotal: {
                    $cond: {
                        if: {
                            $eq: ["$paymentMethod", "Pay online"]
                        },
                        then: {
                            $multiply: ["$productDetails.quantity", "$productDetails.price"]
                        },
                        else: {
                            $cond: {
                                if: {
                                    $ne: ["$productDetails.deliveryStatus", "Cancelled"]
                                },
                                then: {
                                    $multiply: ["$productDetails.quantity", "$productDetails.price"]
                                },
                                else: 0
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: {
                    $sum: "$subTotal"
                },
                discountAmount: {
                    $first: "$discountAmount"
                },
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: {
                            $ne: ["$totalAmount", 0]
                        },
                        then: {
                            $subtract: ["$totalAmount", "$discountAmount"]
                        },
                        else: "$totalAmount"
                    }

                }
            }
        },



    ])
    console.log(orderStatistics);
    return res.render("page-orders-detail.ejs", { order, orderStatistics })
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
                    $multiply: ['$productDetails.quantity', "$productDetails.price"]
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

const adminOderUpdateController = asyncHandler(async (req, res) => {
    const { orderId, productId, updateMethod } = req.body;

    // converting to mongodb objectid
    const orderIdObject = new mongoose.Types.ObjectId(orderId)
    const productIdObject = new mongoose.Types.ObjectId(productId)

    // updating the order based on update method from user side
    if (updateMethod === "shipped") {
        await Order.updateOne(
            { _id: orderIdObject, "productDetails.product": productIdObject },
            { $set: { "productDetails.$.deliveryStatus": "Shipped" } }
        )
        return res.status(200).json({ message: "Your order has been successfully Updated. If you have any further questions or concerns, please feel free to contact our customer support" })

    } else if (updateMethod === "out-for-delivery") {
        await Order.updateOne(
            { _id: orderIdObject, "productDetails.product": productIdObject },
            { $set: { "productDetails.$.deliveryStatus": "Out For Delivery" } }
        )
        return res.status(200).json({ message: "Your order has been successfully Updated. If you have any further questions or concerns, please feel free to contact our customer support" })

    } else if (updateMethod === "delivered") {
        await Order.updateOne(
            { _id: orderIdObject, "productDetails.product": productIdObject },
            { $set: { "productDetails.$.deliveryStatus": "Delivered" } }
        )

        // When order is delivered, update the payment status to successful
        await Order.updateOne(
            { _id: orderIdObject },
            { $set: { paymentStatus: "Successful" } }
        )

        return res.status(200).json({ message: "Your order has been successfully Updated. If you have any further questions or concerns, please feel free to contact our customer support" })

    } else {
        await Order.updateOne(
            { _id: orderIdObject, "productDetails.product": productIdObject },
            { $set: { "productDetails.$.deliveryStatus": "Cancelled" } }
        )
        return res.status(200).json({ message: "Your order has been successfully Updated. If you have any further questions or concerns, please feel free to contact our customer support" })
    }
})

const orderFilterController = asyncHandler(async (req, res) => {

    let { paymentFilterValue, categoryFilterValue } = req.query;


    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;


    // Finding out total orders
    const totalOrders = await Order.aggregate([
        {
            $unwind: "$productDetails"
        },
        {
            $match: {
                $expr: {
                    $cond: {
                        if: { $eq: [paymentFilterValue, "Paid"] },
                        then: { $eq: ["$paymentStatus", "Successful"] },
                        else: {
                            $cond: {
                                if: { $eq: [paymentFilterValue, "Pending"] },
                                then: { $eq: ["$paymentStatus", "Pending"] },
                                else: true
                            }
                        }
                    }
                }

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
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $match: {
                $expr: {
                    $cond: {
                        if: { $ne: [categoryFilterValue, "All Categories"] },
                        then: { $eq: [{ $arrayElemAt: ["$category.name", 0] }, categoryFilterValue] },
                        else: true
                    }
                }
            }
        },
        {
            $group: {
                _id: "$_id"
            }
        },
        {
            $group: {
                _id: null,
                totalOrders: {
                    $sum: 1,
                }
            }
        }
    ])

    console.log(totalOrders);

    // Finding out total pages
    let totalPages;
    if (totalOrders.length > 0) {
        totalPages = Math.ceil((totalOrders[0].totalOrders) / limit)
    }

    const orders = await Order.aggregate([
        {
            $unwind: "$productDetails"
        },
        {
            $match: {
                $expr: {
                    $cond: {
                        if: { $eq: [paymentFilterValue, "Paid"] },
                        then: { $eq: ["$paymentStatus", "Successful"] },
                        else: {
                            $cond: {
                                if: { $eq: [paymentFilterValue, "Pending"] },
                                then: { $eq: ["$paymentStatus", "Pending"] },
                                else: true
                            }
                        }
                    }
                }
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            },
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
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $match: {
                $expr: {
                    $cond: {
                        if: { $ne: [categoryFilterValue, "All Categories"] },
                        then: { $eq: [{ $arrayElemAt: ["$category.name", 0] }, categoryFilterValue] },
                        else: true
                    }
                }
            }
        },
        // If it is cash on delivery and product is cancelled, then subtotal set to zero
        // if it is online payment, then no changes
        {
            $addFields: {
                subTotal: {
                    $cond: {
                        if: {
                            $eq: ["$paymentMethod", "Pay online"]
                        },
                        then: {
                            $multiply: ["$productDetails.quantity", "$productDetails.price"]
                        },
                        else: {
                            $cond: {
                                if: {
                                    $ne: ["$productDetails.deliveryStatus", "Cancelled"]
                                },
                                then: {
                                    $multiply: ["$productDetails.quantity", "$productDetails.price"]
                                },
                                else: 0
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                user: {
                    $first: "$user"
                },
                paymentMethod: {
                    $first: "$paymentMethod"
                },
                paymentStatus: {
                    $first: "$paymentStatus"
                },
                discountAmount: {
                    $first: "$discountAmount"
                },
                totalAmount: {
                    $sum: "$subTotal"
                },
                createdAt: {
                    $first: "$createdAt"
                },
                statuses: {
                    $push: "$productDetails.deliveryStatus"
                }
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: {
                            $ne: ["$totalAmount", 0]
                        },
                        then: {
                            $subtract: ["$totalAmount", "$discountAmount"]
                        },
                        else: "$totalAmount"
                    }

                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        },
        {
            $project: {
                user: 1,
                totalAmount: 1,
                paymentMethod: 1,
                paymentStatus: 1,
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y",
                        date: "$createdAt"
                    }
                },
                status: {
                    $cond: {
                        if: {
                            $allElementsTrue: { // If all products got cancelled, then order status is cancelled
                                $map: {
                                    input: "$statuses",
                                    as: "status",
                                    in: {
                                        $eq: ["$$status", "Cancelled"]
                                    }
                                }
                            }
                        },
                        then: "Cancelled",
                        else: {
                            $cond: {
                                if: {
                                    $allElementsTrue: { // If all the orders are delivered, status is delivered, else processing
                                        $map: {
                                            input: "$statuses",
                                            as: "status",
                                            in: {
                                                $cond: {
                                                    if: { $eq: ["$$status", "Cancelled"] },
                                                    then: true,
                                                    else: { $eq: ["$$status", "Delivered"] }
                                                }
                                            }
                                        }
                                    }
                                },
                                then: "Delivered",
                                else: "Processing"
                            }
                        }

                    }
                },
            }
        },

    ])

    console.log(orders);

    const orderStatistics = await Order.aggregate([
        {
            $match: {
                paymentStatus: "Successful"
            }
        },
        {
            $unwind: "$productDetails"
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
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $match: {
                $expr: {
                    $cond: {
                        if: { $ne: [categoryFilterValue, "All Categories"] },
                        then: { $eq: [{ $arrayElemAt: ["$category.name", 0] }, categoryFilterValue] },
                        else: true
                    }
                }
            }
        },
        // If it is online payment, taking the orders which are not cancelled, 
        // if it is COD, taking the orders which are delivered
        {
            $addFields: {
                subTotal: {
                    $cond: {
                        if: {
                            $eq: ["$paymentMethod", "Pay online"]
                        },
                        then: {
                            $cond: {
                                if: {
                                    $ne: ["$productDetails.deliveryStatus", "Cancelled"]
                                },
                                then: {
                                    $multiply: ["$productDetails.quantity", "$productDetails.price"]
                                },
                                else: 0
                            }
                        },
                        else: {
                            $cond: {
                                if: {
                                    $eq: ["$productDetails.deliveryStatus", "Delivered"]
                                },
                                then: {
                                    $multiply: ["$productDetails.quantity", "$productDetails.price"]
                                },
                                else: 0
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                totalAmount: {
                    $sum: "$subTotal",

                },
                discountAmount: {
                    $first: "$discountAmount"
                },
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: {
                            $ne: ["$totalAmount", 0]
                        },
                        then: {
                            $subtract: ["$totalAmount", "$discountAmount"]
                        },
                        else: "$totalAmount"
                    }

                }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: {
                    $sum: "$totalAmount"
                }
            }
        },
    ])

    return res.status(200).json({ page, totalPages, totalOrders, orders, orderStatistics })

})

export {
    userCheckoutController,
    userOrderViewController,
    userOrderDetailedViewController,
    userOrderUpdateControler,
    adminOrderViewController,
    adminOrderDetailedViewController,
    adminOderUpdateController,
    orderFilterController
}
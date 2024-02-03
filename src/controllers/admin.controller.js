import { asyncHandler } from "../utils/asyncHandler.js"
import adminValidationSchema from "../utils/validation/admin.validation.js";
import { User } from "../models/user.model.js"
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js"
import { Category } from "../models/category.model.js"


const adminLoginController = {

    getLoginPage: asyncHandler(async (req, res) => {
        if (req.session.adminEmail) {
            return res.redirect("/admin/home")
        }
        return res.render("page-account-login.ejs")
    }),

    loginAdmin: asyncHandler(async (req, res) => {
        //take email and password form req.body
        //validate it 
        //match it with process.env.adminlogin credentials
        //if correct render home page
        //if not send invalid credetnials

        const { email, password } = req.body;
        const { error } = adminValidationSchema.validate({ email, password })

        if (error) {
            let trimmedMessage = error.message.replace(/^Validation error: /, '');
            return res.render("page-account-login.ejs", { message: trimmedMessage })
        }

        if (!(email === process.env.ADMIN_EMAIL) ||
            !(password === process.env.ADMIN_PASSWORD)
        ) {
            return res.render("page-account-login.ejs", { message: "Invalid credentials" })
        }

        req.session.adminEmail = process.env.ADMIN_EMAIL;
        return res.redirect("/admin/home")
    })
}



const adminHomeController = asyncHandler(async (req, res) => {


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
                "productDetails.deliveryStatus": {
                    $ne: "Cancelled"
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


    // Finding out total pages
    const totalPages = Math.ceil((totalOrders[0].totalOrders) / limit)

    const orders = await Order.aggregate([
        {
            $unwind: "$productDetails"
        },
        {
            $match: {
                "productDetails.deliveryStatus": {
                    $ne: "Cancelled"
                }
            }
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
            $addFields: {
                subTotal: {
                    $multiply: ["$productDetails.quantity", { $arrayElemAt: ["$product.price", 0] }]
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
                totalAmount: {
                    $sum: "$subTotal"
                },
                createdAt: {
                    $first: "$createdAt"
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
                totalOrders: 1,
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y",
                        date: "$createdAt"
                    }
                }
            }
        },
    ])

    // If all the products in an order got cancelled, the order is also
    // cancelled, else, change the totalamount accordingly
    const orderStatistics = await Order.aggregate([
        {
            $unwind: "$productDetails"
        },
        {
            $match: {
                "productDetails.deliveryStatus": {
                    $ne: "Cancelled"
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
            $addFields: {
                subTotal: {
                    $multiply: ["$productDetails.quantity", { $arrayElemAt: ["$product.price", 0] }]
                }
            }
        },
        {
            $group: {
                _id: null,
                totalOrders: {
                    $sum: 1
                },
                totalAmount: {
                    $sum: "$subTotal"
                }
            }
        }
    ])


    const productStatistics = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalProduct: {
                    $sum: 1
                }
            }
        }
    ])

    const categoryStatistics = await Category.aggregate([
        {
            $group: {
                _id: null,
                totalCategories: {
                    $sum: 1
                }
            }
        }
    ])


    const userStatistics = await User.aggregate([
        {
            $match: {
                isVerified: true
            }
        },
        {
            $group: {
                _id: null,
                totalUsers: {
                    $sum: 1
                }
            }
        }
    ])


    return res.render("page-admin-home.ejs", { orders, page, totalPages, orderStatistics, productStatistics, userStatistics, categoryStatistics, categories: res.locals.categories })
})

const blockUserController = asyncHandler(async (req, res) => {

    //take user id from body
    //check if it exist or not
    //if not display user doesnot exist message
    //else check if user is already blocked 
    //if it is, then show already blocked nothing done
    //else make him block,

    const { userId } = req.body;
    const user = await User.findOne(
        { $and: [{ _id: userId }, { isVerified: true }] }
    )
    if (!user) {
        return res.send(`User not found. 
        Please check the provided details and try again.`);
    }

    if (user.isBlocked) {
        return res.send(`User status remains unchanged. 
        ${user.name} is already blocked as per your request.`)
    }

    user.isBlocked = true;
    const blockeduser = await user.save()
    return res.redirect(303, "/admin/users")
})

const unBlockUserController = asyncHandler(async (req, res) => {

    //take user id from body
    //check if it exist or not
    //if not display user doesnot exist message
    //else check if user is already blocked 
    //if it is, then show already blocked nothing done
    //else make him block
    const { userId } = req.body;

    const user = await User.findOne(
        { $and: [{ _id: userId }, { isVerified: true }] }
    )

    if (!user) {
        return res.send(`User not found. 
        Please check the provided details and try again.`);
    }

    if (!user.isBlocked) {
        return res.send(`User status remains unchanged. 
        ${user.name} is already Unblocked as per your request.`)
    }


    user.isBlocked = false;
    const blockeduser = await user.save()
    // return res.send(`user ${blockeduser.name} has been successfully unblocked.`)
    return res.redirect(303, "/admin/users")
})


const adminUserDetailsController = asyncHandler(async (req, res) => {

    return res.render("page-users-list.ejs")
})

const adminUserFilterController = asyncHandler(async (req, res) => {

    const { status, search } = req.query
    
    // For searching
    const regex = new RegExp(search, 'i');

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const commonAggregationPipeline = [
        {
            $match: {
                isVerified: true,
                $expr: {
                    $cond: {
                        if: { $eq: [status, "Active"] },
                        then: { $eq: ["$isBlocked", false] },
                        else: {
                            $cond: {
                                if: { $eq: [status, "Blocked"] },
                                then: { $eq: ["$isBlocked", true] },
                                else: true
                            }
                        }
                    }
                },
                $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }, { mobileNumber: { $regex: regex } }]
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]

    const users = await User.aggregate([
        ...commonAggregationPipeline,
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ])

    const totalUsers = await User.aggregate([
        ...commonAggregationPipeline,
        {
            $group: {
                _id: null,
                totalUsers: {
                    $sum: 1
                }
            }
        }
    ]);

    let totalPages
    if (totalUsers.length > 0) {
        totalPages = Math.ceil((totalUsers[0].totalUsers) / limit)
    }

    return res.status(200).json({ page, users, totalPages })

})



const adminReportController = asyncHandler(async (req, res) => {

    // period eg: daily, weekly, monthly, yearly
    const { period } = req.params;

    // For daily reports
    if (period === "daily") {

        let date = new Date().toISOString()
        date = date.split('T')[0];

        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(date + 'T00:00:00.000Z'),
                        $lt: new Date(date + 'T23:59:59.999Z'),
                    }
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $match: {
                    "productDetails.deliveryStatus": {
                        $ne: "Cancelled"
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
                $addFields: {
                    subTotal: {
                        $multiply: ['$productDetails.quantity', { $arrayElemAt: ["$product.price", 0] }]
                    }
                }
            },
            {
                $project: {
                    product: 1,
                    productDetails: 1,
                    subTotal: 1,
                    createdAt: {
                        $dateToString: {
                            format: "%d-%m-%Y",
                            date: "$createdAt"
                        }
                    }
                }
            }
        ])

        const orderStatistics = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(date + 'T00:00:00.000Z'),
                        $lt: new Date(date + 'T23:59:59.999Z'),
                    }
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $match: {
                    "productDetails.deliveryStatus": {
                        $ne: "Cancelled"
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
                $addFields: {
                    subTotal: {
                        $multiply: ["$productDetails.quantity", { $arrayElemAt: ["$product.price", 0] }]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: {
                        $sum: 1
                    },
                    totalAmount: {
                        $sum: "$subTotal"
                    }
                }
            }
        ])


        const productStatistics = await Product.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(date + 'T00:00:00.000Z'),
                        $lt: new Date(date + 'T23:59:59.999Z'),
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalProduct: {
                        $sum: 1
                    }
                }
            }
        ])

        const userStatistics = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(date + 'T00:00:00.000Z'),
                        $lt: new Date(date + 'T23:59:59.999Z'),
                    }
                }
            },
            {
                $match: {
                    isVerified: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: {
                        $sum: 1
                    }
                }
            }
        ])

        return res.render("admin.reports.ejs", { period, orders, orderStatistics, productStatistics, userStatistics })
    }

    // For weekly reports
    if (period == "monthly") {

        // Current year
        const year = new Date().getFullYear()
        // Current month, month is zero indexed
        let month = new Date().getMonth() + 1
        // Making single digit month, double digit using string padStart method
        month = String(month).padStart(2, "0")
        // Constructing start date
        const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);

        // Calculating the end date of  next month
        let nextMonth = month === 12 ? 1 : Number(month) + 1;
        nextMonth = String(nextMonth).padStart(2, '0');
        const nextYear = month === 12 ? year + 1 : year;
        const endDate = new Date(`${nextYear}-${nextMonth}-01T00:00:00.000Z`);

        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $match: {
                    "productDetails.deliveryStatus": {
                        $ne: "Cancelled"
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
                $addFields: {
                    subTotal: {
                        $multiply: ['$productDetails.quantity', { $arrayElemAt: ["$product.price", 0] }]
                    }
                }
            },
            {
                $project: {
                    product: 1,
                    productDetails: 1,
                    subTotal: 1,
                    createdAt: {
                        $dateToString: {
                            format: "%d-%m-%Y",
                            date: "$createdAt"
                        }
                    }
                }
            }
        ])

        const orderStatistics = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $match: {
                    "productDetails.deliveryStatus": {
                        $ne: "Cancelled"
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
                $addFields: {
                    subTotal: {
                        $multiply: ["$productDetails.quantity", { $arrayElemAt: ["$product.price", 0] }]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: {
                        $sum: 1
                    },
                    totalAmount: {
                        $sum: "$subTotal"
                    }
                }
            }
        ])

        const productStatistics = await Product.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalProduct: {
                        $sum: 1
                    }
                }
            }
        ])

        const userStatistics = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $match: {
                    isVerified: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: {
                        $sum: 1
                    }
                }
            }
        ])


        return res.render("admin.reports.ejs", { period, orders, orderStatistics, productStatistics, userStatistics })
    }

    if (period === "yearly") {

        let year = new Date()
        year = year.getFullYear() // Current year

        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $match: {
                    "productDetails.deliveryStatus": {
                        $ne: "Cancelled"
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
                $addFields: {
                    subTotal: {
                        $multiply: ['$productDetails.quantity', { $arrayElemAt: ["$product.price", 0] }]
                    }
                }
            },
            {
                $project: {
                    product: 1,
                    productDetails: 1,
                    subTotal: 1,
                    createdAt: {
                        $dateToString: {
                            format: "%d-%m-%Y",
                            date: "$createdAt"
                        }
                    }
                }
            }
        ])

        const orderStatistics = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $match: {
                    "productDetails.deliveryStatus": {
                        $ne: "Cancelled"
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
                $addFields: {
                    subTotal: {
                        $multiply: ["$productDetails.quantity", { $arrayElemAt: ["$product.price", 0] }]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: {
                        $sum: 1
                    },
                    totalAmount: {
                        $sum: "$subTotal"
                    }
                }
            }
        ])

        const productStatistics = await Product.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalProduct: {
                        $sum: 1
                    }
                }
            }
        ])

        const userStatistics = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    }
                }
            },
            {
                $match: {
                    isVerified: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: {
                        $sum: 1
                    }
                }
            }
        ])


        return res.render("admin.reports.ejs", { period, orders, orderStatistics, productStatistics, userStatistics })

    }


})

const adminLogoutController = asyncHandler(async (req, res) => {
    req.session.adminEmail = null;
    res.redirect("/admin/login")
})



export {
    adminLoginController,
    blockUserController,
    adminUserDetailsController,
    adminUserFilterController,
    unBlockUserController,
    adminHomeController,
    adminReportController,
    adminLogoutController

}


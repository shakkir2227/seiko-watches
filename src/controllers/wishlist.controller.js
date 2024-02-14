import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";

const addToWishlistController = asyncHandler(async (req, res) => {

    const user = res.locals.user;
    if (!user) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }

    const { product } = req.body;

    // Using addToset, no duplicate product will be added
    await User.updateOne({ _id: user._id }, { $addToSet: { wishlist: product } })

    // Sending the total count of products in wishlist
    const updatedUser = await User.findOne({ _id: user._id })
    const totalProductsInWishlist = updatedUser.wishlist.length

    return res.status(200).json({ totalProductsInWishlist, message: "Added to Wishlist successfully" })

})

const viewWishlistController = asyncHandler(async (req, res) => {

    const user = res.locals.user;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Finding out total products in wishlist
    const totalProductsInWishlist = await User.aggregate([
        {
            $match: {
                _id: user._id
            }
        },
        {
            $unwind: "$wishlist"
        },
    ])


    // Finding out total pages
    let totalPages = 0;
    if (totalProductsInWishlist.length > 0) {
        totalPages = Math.ceil((totalProductsInWishlist.length) / limit)
    }

    const userWishlist = await User.aggregate([
        {
            $match: {
                _id: user._id
            }
        },
        {
            $unwind: "$wishlist"
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        },

        {
            $lookup: {
                from: "products",
                localField: "wishlist",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $addFields: {
                inStock: {
                    $cond: { if: { $gte: [{ $arrayElemAt: ["$product.stock", 0] }, 1] }, then: true, else: false }
                }
            }
        },
        {
            $project: {
                wishlist: 1,
                product: 1,
                inStock: 1,
            }
        }

    ])

    console.log("page");
    console.log(page);
    console.log("total page");

    console.log(totalPages);

    console.log("wishlsit");

    console.log(userWishlist);

    return res.render("shop-wishlist.ejs", { page, totalPages, userWishlist, categories: res.locals.categories })
})

const deleteFromWishlistController = asyncHandler(async (req, res) => {

    const user = res.locals.user
    const { product } = req.body

    await User.updateOne(({ _id: user._id }, {
        $pull: {
            wishlist: product
        }
    }))

    return res.status(200).json({ message: "Removed from wishlist successfully" })

})

export {
    addToWishlistController,
    viewWishlistController,
    deleteFromWishlistController,

}
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

    return res.status(200).json({ message: "Added to Wishlist successfully" })

})

const viewWishlistController = asyncHandler(async (req, res) => {

    const user = res.locals.user;

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


    return res.render("shop-wishlist.ejs", { userWishlist, categories: res.locals.categories })
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
import { Category } from "../models/category.model.js"
import { Product } from "../models/product.model.js"
import { Offer } from "../models/offer.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"


const offerViewController = asyncHandler(async (req, res) => {

    const offers = await Offer.aggregate([
        {
            $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product"
            },

        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $project: {
                product: 1,
                category: 1,
                discountPercent: 1,
                maxDiscountAmount: 1
            }
        }

    ])


    const products = await Product.find()

    const errorMessage = req.flash("error")[0]
    const successMessage = req.flash('success')[0];

    return res.render("page-offers.ejs", { products, categories: res.locals.categories, offers, errorMessage, successMessage })
})


// This is for updating the discounted price, when adding or deleting an offer

const updateDiscountedPrice = asyncHandler(async (product) => {

    // Adding a new field by the name discountedPrice
    const discountedPrice = await Product.aggregate([
        {
            $match: {
                _id: product
            },

        },
        {
            $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "category",
                as: "category"
            }
        },
        {
            $lookup: {
                from: "offers",
                localField: "offer",
                foreignField: "_id",
                as: "productOffer"
            }
        },
        {
            $lookup: {
                from: "offers",
                localField: "category.0.offer",
                foreignField: "_id",
                as: "categoryOffer"
            }
        },
        // Adding discount percent from both product and category
        {
            $addFields: {
                productOfferDiscountPercent: { $ifNull: [{ $arrayElemAt: ["$productOffer.discountPercent", 0] }, null] },
                categoryOfferDiscountPercent: { $ifNull: [{ $arrayElemAt: ["$categoryOffer.discountPercent", 0] }, null] }
            }
        },
        // Making a new field offerpercent, whichever offer is bigger, that will be the offerpercent
        {
            $addFields: {
                offerPercent: {
                    $cond: {
                        if: {
                            $gt: ["$productOfferDiscountPercent", "$categoryOfferDiscountPercent"]
                        },
                        then: "$productOfferDiscountPercent",
                        else: "$categoryOfferDiscountPercent"
                    }

                }
            }
        },
        // That bigger offer's max discount amount is added here
        {
            $addFields: {
                maxDiscountAmount: {
                    $cond: {
                        if: {
                            $gt: ["$productOfferDiscountPercent", "$categoryOfferDiscountPercent"]
                        },
                        then: { $ifNull: [{ $arrayElemAt: ["$productOffer.maxDiscountAmount", 0] }, null] },
                        else: { $ifNull: [{ $arrayElemAt: ["$categoryOffer.maxDiscountAmount", 0] }, null] }
                    }
                }
            }
        },
        {
            $addFields: {
                discountAmount: {
                    $divide: [
                        { $multiply: ["$price", "$offerPercent"] },
                        100
                    ]
                }
            }
        },
        {
            $addFields: {
                discountAmount: {
                    $cond: {
                        if: {
                            $gt: ["$discountAmount", "$maxDiscountAmount"]
                        },
                        then: "$maxDiscountAmount",
                        else: "$discountAmount"
                    }
                }
            }
        },
        {
            $addFields: {
                discountedPrice: {
                    $subtract: ["$price", "$discountAmount"]
                }
            }
        }
    ])

    await Product.updateOne(
        {
            _id: product
        },
        {
            $set: {
                discountedPrice: discountedPrice[0].discountedPrice
            }
        }

    )
})


const addOfferController = asyncHandler(async (req, res) => {

    let { productCategory, product, category, discountPercent, maxDiscountAmount, } = req.body;

    discountPercent = parseInt(discountPercent);

    const productIdObject = new mongoose.Types.ObjectId(product)
    const categoryIdObject = new mongoose.Types.ObjectId(category)

    // From front end, both category and product data will come, here we are filtering
    // accordin to the productcategroy filter

    let offer;

    if (productCategory === "product") {


        // If an offer exist for the product, throw an error
        const product = await Product.aggregate([
            {
                $match: {
                    _id: productIdObject
                },

            },
            {
                $lookup: {
                    from: "offers",
                    localField: "offer",
                    foreignField: "_id",
                    as: "offer"
                }
            }
        ])

        if (product[0].offer[0]) {
            req.flash("error", "Offer already exist for this product")
            return res.redirect("/offer/view")
        }


        // creating a new offer for the product
        offer = await Offer.create({
            product: productIdObject,
            discountPercent,
            maxDiscountAmount: parseInt(maxDiscountAmount),
        })

        // This offer is updated in product
        await Product.updateOne(
            {
                _id: productIdObject
            },
            {
                $set: {
                    offer: offer._id
                }
            }
        )

        // Updating the discounted price in the product
        await updateDiscountedPrice(productIdObject)

    } else {

        // If an offer exist for the category, throw an error
        const category = await Category.aggregate([
            {
                $match: {
                    _id: categoryIdObject
                },

            },
            {
                $lookup: {
                    from: "offers",
                    localField: "offer",
                    foreignField: "_id",
                    as: "offer"
                }
            }
        ])

        if (category[0].offer[0]) {
            req.flash("error", "Offer already exist for this category")
            return res.redirect("/offer/view")
        }

        // Creating a new offer for the category
        offer = await Offer.create({
            category: categoryIdObject,
            discountPercent,
            maxDiscountAmount: parseInt(maxDiscountAmount),
        })


        // This offer is updated in all categories with same name
        const sameNamedSubCategories = await Category.aggregate([
            {
                $match: {
                    name: category[0].name,
                }
            }
        ])

        for (const category of sameNamedSubCategories) {
            await Category.updateOne(
                {
                    _id: category._id
                },
                {
                    $set: {
                        offer: offer._id
                    }
                }
            )
        }

        // Finding the products belong to this category
        const products = []

        for (const category of sameNamedSubCategories) {
            const arr = await Product.aggregate([
                {
                    $match: {
                        category: category._id
                    }
                }
            ])

            products.push(...arr)

        }

        // Now update the diconted price
        for (const product of products) {

            // Updating the discounted price in the product
            await updateDiscountedPrice(product._id)

        }

    }

    req.flash("success", `Offer created successfully`)
    return res.redirect("/offer/view",)

})

const deleteOfferController = asyncHandler(async (req, res) => {


    const { offerId } = req.body
    const offerIdObject = new mongoose.Types.ObjectId(offerId)

    const offer = await Offer.aggregate([
        {
            $match: {
                _id: offerIdObject
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product"
            }
        }
    ])

    // If it is a product offer, remove it from product, and also remove the new price 
    if (offer[0].product.length > 0) {
        await Product.updateOne({ _id: offer[0].product[0]._id }, { $set: { offer: null } })

        // Updating the discounted price in the product
        await updateDiscountedPrice(offer[0].product[0]._id)
    }

    // If it is a category offer, remove it from all categories with the same names
    let categories = []

    if (offer[0].category.length > 0) {
        categories = await Category.aggregate([
            {
                $match: {
                    name: offer[0].category[0].name
                }
            }
        ])

        for (const category of categories) {
            await Category.updateOne({ _id: category._id }, { $set: { offer: null } })
        }

        // Finding the products belong to this category
        const products = []

        for (const category of categories) {
            const arr = await Product.aggregate([
                {
                    $match: {
                        category: category._id
                    }
                }
            ])

            products.push(...arr)

        }

        // Now update the diconted price
        for (const product of products) {

            // Updating the discounted price in the product
            await updateDiscountedPrice(product._id)

        }

    }


    // Deleting the offer which get from body of the request
    await Offer.deleteOne({ _id: offer[0]._id })

    return res.status(200).json({ message: "Offer deleted successfully" })
})


export {
    offerViewController,
    addOfferController,
    deleteOfferController
} 
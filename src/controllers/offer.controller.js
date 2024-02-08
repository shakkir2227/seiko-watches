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

    console.log(offers);

    const products = await Product.find()

    const categories = await Category.find()

    const errorMessage = req.flash("error")[0]
    const successMessage = req.flash('success')[0];

    return res.render("page-offers.ejs", { products, categories, offers, errorMessage, successMessage })
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
            console.log("offer already exist for this product");
            return
        }


        // creating a new offer for the product
        offer = await Offer.create({
            product: productIdObject,
            discountPercent,
            maxDiscountAmount: parseInt(maxDiscountAmount),
        })

    } else {

        // If an offer exist for the product, throw an error
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
            console.log("offer already exist for this category");
            return
        }

        // Creating a new offer for the category
        offer = await Offer.create({
            category: categoryIdObject,
            discountPercent,
            maxDiscountAmount: parseInt(maxDiscountAmount),
        })

    }

    req.flash("success", `Offer created successfully`)
    return res.redirect("/offer/view",)

})


export {
    offerViewController,
    addOfferController
} 
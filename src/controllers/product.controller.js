import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose";
import { Product } from "../models/product.model.js"
import { Category } from "../models/category.model.js"
import { User } from "../models/user.model.js";
import { addProductSchema, updateProductSchema } from "../utils/validation/product.validation.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import colors from "colors"

const addProductController = {

    renderAddProductPage: asyncHandler(async (req, res) => {

        //To display in the category option finding out the cat-path


        const getCategoryPath = async (categoryId) => {
            const category = await Category.findById(categoryId).exec();
            const categoryName = category.name;

            let pathArr = [categoryName];

            if (category.parentCategoryId) {
                const parentPathArr = await getCategoryPath(category.parentCategoryId);
                pathArr = pathArr.concat(parentPathArr);
            }

            return pathArr.join(">>")
        };

        const allCategories = await Category.find({})

        const categoryPathArr = await Promise.all(
            allCategories.map(async (category) => {
                return {
                    category,
                    path: await getCategoryPath(category._id),
                };
            })
        );



        const errorMessage = req.flash("error")[0]
        const successMessage = req.flash('success')[0];
        return res.render("page-form-product.ejs", { categoryPathArr, errorMessage, successMessage })

    }),

    handleAddProductForm: asyncHandler(async (req, res) => {

        //----This is the note for view-category----
        //Only one category drop down should be there
        //and pressing that creates another HTML element
        // so finally product will only have ONE category ID
        //And band material and color is fixed. so make it drop down
        //----End----//

        //Take details from body,
        //validate it with JOI except image
        //check any prodcut name exist with this name
        // if yes, display this name is in use
        //else validate image with joi
        //if OK, 
        // Atleast 3 images should be there

        //Todo, in existed product, we want to check the same product name
        //exist for the same variation, then only we have to block user from
        //addin that. so change accrodingly

        // TODO: in existing product, we have to check if they are in the same categoy
        // also, if they are, 
        const {
            name
            , description
            , categoryPath
            , price
            , stock
            , bandMaterial
            , dialColor
        } = req.body;

        if (categoryPath) {
            var categoryName = categoryPath.split(">>")[0];
        }

        const { error } = addProductSchema.validate({
            name
            , description
            , categoryName
            , price
            , stock
            , bandMaterial
            , dialColor
        })
        if (error) {
            req.flash('error', error.message);
            return res.redirect("/product/add")
        }


        const existedProduct = await Product.findOne({ name });;
        const category = await Category.findOne({ name: categoryName })

        if (existedProduct) {

            // Checking if the product name is existing for the 
            // particular category with same variation        
            if (
                existedProduct.category.equals(category._id)
                && existedProduct.dialColor === dialColor
                && existedProduct.bandMaterial === bandMaterial
            ) {

                req.flash('error', "Oops! This Product name is already in use.");
                return res.redirect("/product/add")
            }
        }

        //image validation
        if (req.files.length < 3 || req.files.length > 5) {
            for (let i = 0; i < req.files.length; i++) {

                fs.unlinkSync(req.files[i].path)

            }

            req.flash('error', "Please upload 3 to 5 photos to enhance the platform visual appeal. Thankyou !!");
            return res.redirect("/product/add")

        }

        if ((req.files).some((file) => {
            file.path === ""
        })) {

            req.flash('error', `Please ensure all uploaded files have valid paths.`);
            return res.redirect("/product/add")


        };

        let images = [];

        for (let i = 0; i < req.files.length; i++) {
            const uploadedImage = await uploadOnCloudinary(req.files[i].path);
            images.push({ url: uploadedImage.url })
        }

        const product = await Product.create({
            name,
            description,
            images,
            category: category._id,
            price,
            stock,
            bandMaterial,
            dialColor,
        })

        req.flash('success', `${product.name} has been added successfully `);
        return res.redirect("/product/add")




    })
}


const blockProductController = asyncHandler(async (req, res) => {
    //take product id from body
    //check it exist or not and it is blocked or not
    //if it is not, block it
    //if it is, display Product is already blocked. No action taken.

    const { productId } = req.body;
    const product = await Product.findOne({ _id: productId });


    if (!product) {
        return res.send(`Sorry, the product  you're trying to block doesn't exist
        in our records. Please verify the product details and try again.`)
    }
    if (product.isBlocked) {
        return res.send(`Product status remains unchanged. 
        ${product.name} is already blocked as per your request.`)
    }


    product.isBlocked = true;
    const blockedProduct = await product.save()
    return res.send(`Product ${blockedProduct.name} has been successfully blocked.`)

})

const unblockProductController = asyncHandler(async (req, res) => {
    //take product id from body
    //check it exist or not and it is blocked or not
    //if it is unblock it
    //if it is not, display Product is already blocked. No action taken.

    const { productId } = req.body;
    const product = await Product.findOne({ _id: productId });


    if (!product) {
        return res.send(`Unblock Error: The product you're attempting
         to unblock is not found in our records. Please verify the
          product details and try again.`)
    }
    if (!product.isBlocked) {
        return res.send(`Status Unchanged:
         ${product.name} is already unblocked
         as per your request. No further action is needed`)
    }

    product.isBlocked = false;
    const blockedProduct = await product.save()
    return res.send(`Product ${blockedProduct.name} 
    has been unblocked successfully.`)

})

const updateProductViewController = asyncHandler(async (req, res) => {

    const productId = req.params.id;
    const product = await Product.findOne({ _id: productId }).populate("category")

    const getCategoryPath = async (categoryId) => {
        const category = await Category.findById(categoryId).exec();
        const categoryName = category.name;

        let pathArr = [categoryName];

        if (category.parentCategoryId) {
            const parentPathArr = await getCategoryPath(category.parentCategoryId);
            pathArr = pathArr.concat(parentPathArr);
        }

        return pathArr.join(">>")
    };

    const categoryPathOfCurrentProduct = await getCategoryPath(product.category._id)
    const allCategories = await Category.find({})

    let categoryPathArr = await Promise.all(
        allCategories.map(async (category) => {
            return {
                category,
                path: await getCategoryPath(category._id),
            };
        })
    );

    categoryPathArr = categoryPathArr.filter((element) => {
        return element.path !== categoryPathOfCurrentProduct
    })

    let colorVariations = ["Black", "Blue", "Brown"]
    colorVariations = colorVariations.filter((element) => {
        return element !== product.dialColor
    })

    let materialVariations = ["Leather", "Metal", "Titanium"]
    materialVariations = materialVariations.filter((element) => {
        return element !== product.bandMaterial
    })

    const errorMessage = req.flash("error")[0]
    const successMessage = req.flash('success')[0];
    return res.render("page-form-edit.ejs", { product, categoryPathOfCurrentProduct, categoryPathArr, colorVariations, materialVariations, errorMessage, successMessage })

})

const updateProductController = asyncHandler(async (req, res) => {

    // User sends an array of removed images array
    // We have to get that array, and remove the corresponding url
    // from our product image array

    // TODO: in product validation schema, use category instead of category name

    const {
        productId,
        name,
        description,
        price, stock,
        bandMaterial,
        dialColor,
        categoryPath,
        removedImages,
        status
    } = req.body;

    const product = await Product.findOne({ _id: productId })

    const { error } = addProductSchema.validate({
        name,
        description,
        price, stock,
        bandMaterial,
        dialColor,

    })

    if (error) {
        req.flash('error', error.message);
        return res.redirect(`/product/update/${product._id}`)
    }


    const existedProduct = await Product.findOne({ name, _id: { $ne: productId } });
    const category = await Category.findOne({ _id: categoryPath })

    if (existedProduct) {

        // Checking if the product name is existing for the 
        // particular category with same variation        
        if (
            existedProduct.category.equals(category._id)
            && existedProduct.dialColor === dialColor
            && existedProduct.bandMaterial === bandMaterial
        ) {

            req.flash('error', "Oops! This Product name is already in use.");
            return res.redirect(`/product/update/${product._id}`)
        }
    }

    // Finding the particular product and update the same.


    product.name = name;
    product.description = description;
    product.category = category._id;
    product.price = price;
    product.stock = stock;
    product.bandMaterial = bandMaterial;
    product.dialColor = dialColor;
    product.isBlocked = status === "Active" ? false : true;


    if (!removedImages && req.files.length === 0) {

        const updatedProduct = await product.save();
        req.flash('success', `Your request to update ${updatedProduct.name} has been processed succesfully`);
        return res.redirect("/product/view-admin")
    }

    if ((product.images.length + req.files.length) < 3 || (product.images.length + req.files.length) > 5) {

        for (let i = 0; i < req.files.length; i++) {
            fs.unlinkSync(req.files[i].path)
        }

        req.flash('error', "Ensure 3 to 5 photos are present for the product to enhance the platform visual appeal. Thankyou !!");
        return res.redirect(`/product/update/${product._id}`)

    }

    if (!removedImages) {
        for (let i = 0; i < req.files.length; i++) {
            const uploadedImage = await uploadOnCloudinary(req.files[i].path);
            product.images.push({ url: uploadedImage.url })
        }

        const updatedProduct = await product.save()

        req.flash('success', `Your request to update ${updatedProduct.name} has been processed succesfully`);
        return res.redirect("/product/view-admin")
    }


    let updatedImages = product.images.filter((image) => {
        return !removedImages.includes(image.url)
    })

    let totalImageCount = req.files.length + updatedImages.length;

    if ((totalImageCount < 3 || totalImageCount > 5)) {
        for (let i = 0; i < req.files.length; i++) {
            fs.unlinkSync(req.files[i].path)
        }

        req.flash('error', "Ensure 3 to 5 photos are present for the product to enhance the platform visual appeal. Thankyou !!");
        return res.redirect(`/product/update/${product._id}`)

    }

    if ((req.files).some((file) => {
        file.path === ""
    })) {

        req.flash('error', `Please ensure all uploaded files have valid paths.`);
        return res.redirect(`/product/update/${product._id}`)


    };

    for (let i = 0; i < req.files.length; i++) {
        const uploadedImage = await uploadOnCloudinary(req.files[i].path);
        updatedImages.push({ url: uploadedImage.url })
    }

    product.images = updatedImages;

    const updatedProduct = await product.save()

    req.flash('success', `Your request to update ${updatedProduct.name} has been processed succesfully`);
    return res.redirect("/product/view-admin")

})

const productViewController = {

    adminProductView: asyncHandler(async (req, res) => {

        //Take all products from database
        //display one image, name, cat name, stock, isBlocked or not
        //And editing option

        const errorMessage = req.flash("error")[0]
        const successMessage = req.flash('success')[0];
        const products = await Product.find({}).populate("category")

        return res.render("page-products-list.ejs", { products, errorMessage, successMessage })

    }),

    userProductView: {

        getSingleProductView: asyncHandler(async (req, res) => {

            //we have to show the related products also
            //so take the cat id of the product 
            //list all the products of the same category except the current product
            //while listing we should avoid same products

            // We have to check the current product is in the user's cart or not
            // if it is there, send availableincart as true. so that we can 
            // toggle the addtocart button to view cart

            const userId = req.session.userId;
            let userIdObject;
            if (userId) {
                userIdObject = new mongoose.Types.ObjectId(userId);
            }

            const productId = req.params.productId;
            const productIdObject = new mongoose.Types.ObjectId(productId);
            const product = await Product.findOne({ _id: productId }).populate("category");

            // Rendering 404 page if the product is Blocked.
            if (product.isBlocked) {
                return res.render("page-404.ejs");
            }

            // Checking the product is in user's cart
            let availableincart;
            if (userId) {
                availableincart = await User.aggregate([
                    {
                        $match: {
                            _id: userIdObject,
                            "cart.product": productIdObject
                        },
                    }
                ])

            }

            const productWithVariations = await Product.aggregate([{
                $match: { name: product.name, isBlocked: false, _id: { $ne: product._id } },
            }])

            let relatedProducts = await Product.aggregate([{ $match: { isBlocked: false, category: product.category._id, _id: { $ne: product._id }, name: { $ne: product.name } } }, {
                $group: {
                    _id: "$name",
                    uniqueProduct: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$uniqueProduct" }
            }])

            return res.render("shop-product-full.ejs", { product, relatedProducts, availableincart, productWithVariations, categories: res.locals.categories, user: res.locals.user })

        }),


        // Taking the categoryId from the query params
        // Finding the category, and all its subcategories
        // Finding it's parent Category if it exist.
        // Finding all products of the category, and it's subcategoires

        getAllProductsView: asyncHandler(async (req, res) => {

            const categoryId = req.query.category;

            const selectedCategory = await Category.findOne({ _id: categoryId });

            let parentCategory;
            if (selectedCategory.parentCategoryId) {
                parentCategory = await Category.findOne({ _id: selectedCategory.parentCategoryId })
            }

            // Finding all top categories and it's immediate sub categories
            const topCategories = await Category.find({ parentCategoryId: null });

            const subCategoriesofTopCategories = [];
            for (const category of topCategories) {
                const subCategories = await Category.find({ parentCategoryId: category._id })
                subCategoriesofTopCategories.push(...subCategories)
            }

            return res.render("shop-grid-left.ejs", { selectedCategory, parentCategory, topCategories, subCategoriesofTopCategories })

        })


    }



}


export {
    addProductController,
    blockProductController,
    updateProductController,
    unblockProductController,
    productViewController,
    updateProductViewController,

}
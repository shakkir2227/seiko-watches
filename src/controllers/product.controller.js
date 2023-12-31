import { asyncHandler } from "../utils/asyncHandler.js"
import { Product } from "../models/product.model.js"
import { Category } from "../models/category.model.js"
import { addProductSchema, updateProductSchema } from "../utils/validation/product.validation.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import colors from "colors"


const addProductViewController = asyncHandler(async (req, res) => {

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

})

const addProductController = asyncHandler(async (req, res) => {
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


    const existedProduct = await Product.findOne({ name });
    if (existedProduct) {

        req.flash('error', "Oops! This Product name is already in use.");
        return res.redirect("/product/add")
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

    const category = await Category.findOne({ name: categoryName })


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

    const errorMessage = req.flash("error")[0]
    const successMessage = req.flash('success')[0];
    return res.render("page-form-edit.ejs", { product, errorMessage, successMessage })

})

const updateProductController = asyncHandler(async (req, res) => {

    //User sends an array of removed images array
    //we have to get that array, and remove the corresponding url
    //from our product image array

    const { productId, description, price, stock, removedImages, status } = req.body;

    const product = await Product.findOne({ _id: productId })

    const { error } = updateProductSchema.validate({ description, price, stock })

    if (error) {
        req.flash('error', error.message);
        return res.redirect(`/product/update/${product._id}`)

    }

    product.description = description;
    product.price = price;
    product.stock = stock;
    product.isBlocked = status === "Active" ? false : true;


    if(!removedImages && req.files.length === 0) {
        
        const updatedProduct = await product.save();
        req.flash('success', `Your request to update ${updatedProduct.name} has been processed succesfully`);
        return res.redirect("/product/view-admin")
    }

    if ((product.images.length + req.files.length) < 3 || (product.images.length + req.files.length) > 5  ){

        for (let i = 0; i < req.files.length; i++) {
            fs.unlinkSync(req.files[i].path)
        }

        req.flash('error', "Ensure 3 to 5 photos are present for the product to enhance the platform visual appeal. Thankyou !!");
        return res.redirect(`/product/update/${product._id}`)

    }

    if(!removedImages) {
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

const adminProductViewController = asyncHandler(async (req, res) => {

    //Take all products from database
    //display one image, name, cat name, stock, isBlocked or not
    //And editing option

    const errorMessage = req.flash("error")[0]
    const successMessage = req.flash('success')[0];
    const products = await Product.find({}).populate("category")

    return res.render("page-products-list.ejs", { products, errorMessage, successMessage })
})


export {
    addProductController,
    blockProductController,
    updateProductController,
    unblockProductController,
    adminProductViewController,
    addProductViewController,
    updateProductViewController,

}
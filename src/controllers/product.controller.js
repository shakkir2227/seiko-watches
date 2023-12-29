import { asyncHandler } from "../utils/asyncHandler.js"
import { Product } from "../models/product.model.js"
import { Category } from "../models/category.model.js"
import { addProductSchema, updateProductSchema } from "../utils/validation/product.validation.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

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
    const {
        name
        , description
        , categoryName
        , price
        , stock
        , bandMaterial
        , dialColor
    } = req.body;

    const { error } = addProductSchema.validate({
        name
        , description
        , categoryName
        , price
        , stock
    })
    if (error) {
        console.log(error);
        return res.send(error.message);
    }

    const existedProduct = await Product.findOne({ name });
    if (existedProduct) {
        console.log(req.files);
        return res.send("Oops! This Product name is already in use.")
    }

    //image validation
    if (req.files.length < 3 || req.files.length > 5) {
        for (let i = 0; i < req.files.length; i++) {
            console.log(req.files[i]);
            fs.unlinkSync(req.files[i].path)

        }

        return res.send(`Please upload 3 to 5 photos
         to enhance the platform's visual appeal. Thank you.`)
    }

    if ((req.files).some((file) => {
        file.path === ""
    })) {
        return res.send(`Please ensure all uploaded files have valid paths.`)
    };

    let images = [];

    for (let i = 0; i < req.files.length; i++) {
        const uploadedImage = await uploadOnCloudinary(req.files[i].path);
        images.push({ url: uploadedImage.url })
    }

    const category = await Category.findOne({ name: categoryName })
    console.log(category);

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

    return res.send(product)



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

const updateProductController = asyncHandler(async (req, res) => {
    const { productId, description, price, stock } = req.body;

    const { error } = updateProductSchema.validate({ description, price, stock })
    if (error) {
        return res.send(error.message)
    }
    const product = await Product.findOne({ _id: productId })

    product.description = description;
    product.price = price;
    product.stock = stock;

    const updatedProduct = await product.save()
    return res.send(updatedProduct);

})


export {
    addProductController,
    blockProductController,
    updateProductController,
    unblockProductController
}
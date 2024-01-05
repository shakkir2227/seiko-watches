import { asyncHandler } from "../utils/asyncHandler.js"
import { Category } from "../models/category.model.js";
import { categoryValidationSchema } from "../utils/validation/category.validation.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import fs from "fs"
import { get } from "mongoose";



const addCategory = asyncHandler(async (req, res) => {

    //validate name only, parent-category is select mode
    //check if the category name exist
    //if exist check if any of the parent of these are same
    //if same, display category already exist
    //Then check if parent category is none
    // if parent category is not "none" include that.. 
    //also in creation of the category
    //added image upload also

    //todo== what same named category, the existing doesnot have parent


    const { name, parentCategoryName } = req.body;
    const { error } = categoryValidationSchema.validate({ name })
    if (error) {
        req.flash('error', `${error.message}`);
        return res.redirect("/category/view")

    }

    const existedCategories = await Category.find({ name }).populate("parentCategoryId");

    if (existedCategories.length > 0) {
        if (existedCategories
            .some((category) => category.parentCategoryId.name === parentCategoryName)) {

            let message = encodeURIComponent("");
            req.flash('error', `This Category Name already exists. Try a new one!!`);
            return res.redirect("/category/view")

        }
    }

    if (!req.file) {
        
        req.flash('error', "Please ensure that you uploaded one image. Thankyou !!");
        return res.redirect("/category/view")

    }

    if (req.file.path === "") {

        req.flash('error', `Please ensure uploaded file have valid path.`);
        return res.redirect("/category/view")

    };

    const image = await uploadOnCloudinary(req.file.path);

    if (parentCategoryName === "none") {
        const category = await Category.create({
            name,   
            image:image.url,

        });

        req.flash('success', `Category ${category.name} created successfully`);
        return res.redirect("/category/view")
    }
    else {

        const parentCategory = await Category.findOne({ name: parentCategoryName });
        const parentCategoryId = parentCategory._id;
        const category = await Category.create({
            name,
            parentCategoryId,
            image: image.url

        });

        req.flash('success', `Category ${category.name} has been added in ${parentCategory.name} successfully`);
        return res.redirect("/category/view")

    }

})

const viewCategory = asyncHandler(async (req, res) => {

    //find all categories
    //get all categories which don't have a subcategory
    //find out it's complete parent categories/ path of a category
    // also take messagees from query, which are came from redirecting

    // const message = req.query.message

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

    // const categoriesWithoutSubcategories = await Category.find({ _id: { $nin: await Category.distinct('parentCategoryId') } }).exec();
    // const categoryPathArr = await Promise.all(
    //     categoriesWithoutSubcategories.map(async (category) => {
    //         return {
    //             category,
    //             path: await getCategoryPath(category._id),
    //         };
    //     })
    // );

    const errorMessage = req.flash("error")[0]
    const successMessage = req.flash('success')[0];

    return res.render("page-categories.ejs", { allCategories, categoryPathArr, errorMessage, successMessage })

    // return res.render("page-categories.ejs", { allCategories, categoryPathArr, message })

});


const blockCategoryAndSubCategories = asyncHandler(async (req, res) => {
    //Find the category from database
    //Make it's isBlocked value to TRUE
    //Findout the categories in which the parent category is THIS
    //block them, and block it's subcategories also..
    //using recursion and give the condition if it exists.

    const { _id } = req.body;

    const category = await Category.findOne({ _id })
    category.isBlocked = true;
    await category.save();

    async function blockSubCategories(category) {
        const subCategories = await Category.find({ parentCategoryId: category._id });
        if (subCategories.length === 0) {
            return null
        }

        subCategories.forEach(async (subCategory) => {
            subCategory.isBlocked = true;
            await subCategory.save();
            blockSubCategories(subCategory)
        })

    }

    await blockSubCategories(category);

    let message = `${category.name} has been blocked successfully`

    return res.send({ status: 'blocked', category });


})

const unblockCategoryAndSubCategories = asyncHandler(async (req, res) => {

    //tocomplete: if main category is in unblocked state, we shouldnot be able
    //to unblock the subcategories of it. then we should display the messaee
    //of first unblock the main category


    const { _id } = req.body;

    const category = await Category.findOne({ _id })

    category.isBlocked = false;
    await category.save();

    async function unBlockSubCategories(category) {
        const subCategories = await Category.find({ parentCategoryId: category._id });
        if (subCategories.length === 0) {
            return null
        }

        subCategories.forEach(async (subCategory) => {
            subCategory.isBlocked = false;
            await subCategory.save();
            unBlockSubCategories(subCategory)
        })

    }

    await unBlockSubCategories(category);

    return res.send({ status: 'Unblocked', category });
})

const editCategory = asyncHandler(async (req, res) => {
    //take category Id and new name from the user
    //validate it
    //check entered name is same, then display 
    //check new name exist or not, if exist, check both parents are same or not
    //if same, display category already exist
    //else update the name

    const { name, categoryId } = req.body;
    const { error } = categoryValidationSchema.validate({ name });
    if (error) {
        res.send(error.message)
    }
    const category = await Category.findOne({ _id: categoryId }).populate("parentCategoryId");

    if (name === category.name) {
        return res.send("Thank you for keeping your profile information up-to-date.")
    }

    const existedCategories = await Category.find({ name }).populate("parentCategoryId");

    if (existedCategories.length > 0) {
        if (existedCategories
            .some((existedCategory) => existedCategory.parentCategoryId.name === category.parentCategoryId.name)) {
            return res.send((`
            
                `))
        }
    }


    console.log(category);
    category.name = name;
    const updatedCategory = await category.save();
    return res.send(updatedCategory);
})


export {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    unblockCategoryAndSubCategories,
    editCategory
}
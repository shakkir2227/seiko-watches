import { asyncHandler } from "../utils/asyncHandler.js"
import { Category } from "../models/category.model.js";
import { categoryValidationSchema } from "../utils/validation/category.validation.js";
import { get } from "mongoose";


const addCategory = asyncHandler(async (req, res) => {
    //validate name only, parent-category is select mode
    //check if the category name exist
    //if exist check if any of the parent of these are same
    //if same, display category already exist
    //Then check if parent category is none
    // if parent category is not "none" include that.. 
    //also in creation of the category

    const { name, parentCategoryName } = req.body;
    const { error } = categoryValidationSchema.validate({ name })
    if (error) {
        return res.render("page-categories.ejs", { message: error.message })

    }

    const existedCategories = await Category.find({ name }).populate("parentCategoryId");

    if (existedCategories.length > 0) {
        if (existedCategories
            .some((category) => category.parentCategoryId.name === parentCategoryName)) {
            return res.send((`
             This Category Name already exists. 
             Try a new one !!
             `))
        }
    }

    if (parentCategoryName === "none") {
        const category = await Category.create({
            name,
        });
        return res.send(category)
    }
    else {

        const parentCategory = await Category.findOne({ name: parentCategoryName });
        const parentCategoryId = parentCategory._id;
        const category = await Category.create({
            name,
            parentCategoryId

        });

        return res.render("page-categories.ejs")

    }

})

const viewCategory = asyncHandler(async (req, res) => {
    const getCategoryPath = async (categoryId) => {
        const category = await Category.findById(categoryId).exec();
        const categoryName = category.name;
        let pathArr = [categoryName];

        if (category.parentCategoryId) {
            const parentPathArr = await getCategoryPath(category.parentCategoryId);
            pathArr = pathArr.concat(parentPathArr);
        }

        return pathArr;
    };

    const categoriesWithoutSubcategories = await Category.find({ _id: { $nin: await Category.distinct('parentCategoryId') } }).exec();

    const categoryPathArr = await Promise.all(
        categoriesWithoutSubcategories.map(async (category) => {
            return {
                path: await getCategoryPath(category._id),
            };
        })
    );

    return res.render("page-categories.ejs")
});


const blockCategoryAndSubCategories = asyncHandler(async (req, res) => {
    //Find the category from database
    //Make it's isBlocked value to TRUE
    //Findout the categories in which the parent category is THIS
    //block them, and block it's subcategories also..
    //using recursion and give the condition if it exists.

    const { name } = req.body;

    const category = await Category.findOne({ name })
    category.isBlocked = true;
    await category.save();

    async function blockSubCategories(category) {
        const subCategories = await Category.find({ parentCategoryId: category._id });
        if (subCategories.length === 0) {
            return res.send("Category Blocked succesfully")
        }

        subCategories.forEach(async (subCategory) => {
            subCategory.isBlocked = true;
            await subCategory.save();
            blockSubCategories(subCategory)
        })

    }

    blockSubCategories(category);


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
    editCategory
}
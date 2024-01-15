import { asyncHandler } from "../utils/asyncHandler.js"
import { Category } from "../models/category.model.js";
import { categoryValidationSchema } from "../utils/validation/category.validation.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs"



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


    const { name, parentCategoryId } = req.body;
    const { error } = categoryValidationSchema.validate({ name })
    if (error) {
        req.flash('error', `${error.message}`);
        return res.redirect("/category/view")

    }

    const existedCategories = await Category.find({ name }).populate("parentCategoryId");

    if (parentCategoryId === "none") {
        if (existedCategories.length > 0) {
            if (existedCategories
                .some((category) => category.name === name)) {

                req.flash('error', `This Category Name already exists. Try a new one!!`);
                return res.redirect("/category/view")

            }
        }

    } else {
        if (existedCategories.length > 0) {
            if (existedCategories
                .some((category) => category.parentCategoryId.name === parentCategoryId)) {

                let message = encodeURIComponent("");
                req.flash('error', `This Category Name already exists. Try a new one!!`);
                return res.redirect("/category/view")

            }
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

    if (parentCategoryId === "none") {
        const category = await Category.create({
            name,
            image: image.url,

        });

        req.flash('success', `Category ${category.name} created successfully`);
        return res.redirect("/category/view")
    }


    const parentCategory = await Category.findOne({ _id: parentCategoryId });

    const category = await Category.create({
        name,
        parentCategoryId,
        image: image.url

    });

    req.flash('success', `Category ${category.name} has been added in ${parentCategory.name} successfully`);
    return res.redirect("/category/view")



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

        for (const subCategory of subCategories) {
            subCategory.isBlocked = true;
            await subCategory.save();
            await blockSubCategories(subCategory)
        }
        // subCategories.forEach(async (subCategory) => {
        //     subCategory.isBlocked = true;
        //     await subCategory.save();
        //     blockSubCategories(subCategory)
        // })

    }

    await blockSubCategories(category);

    let message = `${category.name} has been blocked successfully`

    return res.json({ status: 'blocked', category });


})

const unblockCategoryAndSubCategories = asyncHandler(async (req, res) => {

    //tocomplete: if main category is in unblocked state, we shouldnot be able
    //to unblock the subcategories of it. then we should display the messaee
    //of first unblock the main category


    const { _id } = req.body;

    const category = await Category.findOne({ _id }).populate("parentCategoryId");

    async function unBlockSubCategories(category) {
        const subCategories = await Category.find({ parentCategoryId: category._id });
        if (subCategories.length === 0) {
            return null
        }

        for (const subCategory of subCategories) {
            subCategory.isBlocked = false;
            await subCategory.save();
            await unBlockSubCategories(subCategory)
        }

    }

    if (!category.parentCategoryId) {

        category.isBlocked = false;
        await category.save();

        await unBlockSubCategories(category);

        return res.json({ status: 'Unblocked', category });
    }


    if (category.parentCategoryId.isBlocked) {

        const error = new Error(`Please unblock the main category
        ${category.parentCategoryId.name} before attempting to unblock its subcategories.`);
        return res.status(500).json({ error: error.message });

    }

    async function mainCategoryBlocked(category) {

        const parentCategory = await Category.findOne({ _id: category.parentCategoryId._id }).populate("parentCategoryId")
        if (parentCategory.parentCategoryId?.isBlocked) {
            return true
        }

        const grandParentCategory = await Category.findOne({ _id: parentCategory.parentCategoryId }).populate("parentCategoryId")
        if (grandParentCategory) {

            await mainCategoryBlocked(grandParentCategory)
        }

    }


    if (await mainCategoryBlocked(category)) {

        const error = new Error(`Please unblock the main category
        before attempting to unblock its subcategories.`);
        return res.status(500).json({ error: error.message });

    }


    category.isBlocked = false;
    await category.save();

    await unBlockSubCategories(category);

    return res.json({ status: 'Unblocked', category });

})

const updateCategoryController = {

    getUpdatePage: asyncHandler(async (req, res) => {

        const categoryId = req.params.categoryId
        const category = await Category.findOne({ _id: categoryId }).populate("parentCategoryId")

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



        let categoryPath = await getCategoryPath(category);

        // Finding all the categories and their categoryPath
        const allCategories = await Category.find({})

        let categoryPathArr = await Promise.all(
            allCategories.map(async (category) => {
                return {
                    category,
                    path: await getCategoryPath(category._id),
                };
            })
        );

        // Removing the categorypath of the updating category  
        categoryPathArr = categoryPathArr.filter((category) => {
            return category.path !== categoryPath;
        })

        categoryPathArr = categoryPathArr.filter((categoryPath) => {
            return categoryPath.path !== category.parentCategoryId?.name;
        })

        categoryPath = categoryPath.replace(category.name + ">>", "")

        if (category.name === categoryPath) {
            categoryPath = "None"
        }

        const errorMessage = req.flash("error")[0]
        const successMessage = req.flash('success')[0];
        return res.render("page-edit-categories.ejs", { category, categoryPath, categoryPathArr, errorMessage, successMessage })
    }),

    updateCategory: asyncHandler(async (req, res) => {

        // Take category Id and new name from the user
        // Validate it 
        // Check new name exist or not, if exist, check both parents are same or not
        // If same, display category already exist
        // Check req.file, if req.file and removed photo is not there,
        // Update name and save.
        // If removed photo is there, and not req.file, or viceverca throw error.
        // Else upload the file into cloudinary, and update the document. 

        const { name, categoryId, parentCategoryId, removedImage } = req.body;
        console.log(req.body);

        // Validating user entered details
        const { error } = categoryValidationSchema.validate({ name });
        if (error) {
            req.flash("error", `${error.message}`)
            return res.redirect(`/category/update/${categoryId}`)
        }

        // Finding the category and existing categories with same name 
        const category = await Category.findOne({ _id: categoryId })
        const existedCategories = await Category.find({ name, _id: { $ne: category._id } }).populate("parentCategoryId");

        // Updating the category name, if parent category is none and 
        // no new images are there, uppdating the name of the category.
        if (parentCategoryId === "None" && !req.file && !removedImage) {
            if (existedCategories.length > 0) {
                req.flash("error", `Category name already exists. Please choose a different name.`)
                return res.redirect(`/category/update/${categoryId}`)
            }

            category.name = name;
            await category.save()

            req.flash('success', `Category ${category.name} updated successfully`);
            return res.redirect("/category/view")
        }

        if (existedCategories.length > 0) {
            if (existedCategories
                .some((existedCategory) => existedCategory.parentCategoryId?.name === category.parentCategoryId?.name)) {
                req.flash("error", `Category name already exists. Please choose a different name.`)
                return res.redirect(`/category/update/${categoryId}`)

            }
        }

        // Finding the parent Category from DB
        const parentCategory = await Category.findOne({ _id: parentCategoryId })
        console.log(parentCategory);
        if (!req.file && !removedImage) {

            // Updating the category name and parent Category
            category.name = name;
            category.parentCategoryId = parentCategory._id;
            const updatedCategory = await category.save();
            console.log(updatedCategory);

            req.flash("success", `Category ${updatedCategory.name} updated successfully. Changes have been applied.`)
            return res.redirect("/category/view")

        }

        if ((req.file && !removedImage) || (!req.file && removedImage)) {
            req.flash('error', "Category image required for enhanced presentation. Please upload one image.");
            return res.redirect(`/category/update/${categoryId}`)
        }

        if (req.file.path === "") {
            req.flash('error', `Please ensure uploaded file have valid path.`);
            return res.redirect(`/category/update/${categoryId}`)
        };

        // Uploading the image to cloudinary 
        // Updating all category details

        const image = await uploadOnCloudinary(req.file.path);

        category.name = name;
        category.parentCategoryId = parentCategory._id;
        category.image = image.url
        const updatedCategory = await category.save();

        req.flash("success", `Category ${updatedCategory.name} updated successfully. Changes have been applied.`)
        return res.redirect("/category/view")
    })
}




export {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    unblockCategoryAndSubCategories,
    updateCategoryController

}
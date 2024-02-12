import { asyncHandler } from "../utils/asyncHandler.js";
import { Category } from "../models/category.model.js";
import { User } from "../models/user.model.js";

async function setCategoryData(req, res, next) {

    const primaryCategories =

        await Category.aggregate([{ $match: { parentCategoryId: null, isBlocked: false } }])

    let secondaryCategories = [];

    for (const primaryCategory of primaryCategories) {
        const categories = await Category.aggregate([
            { $match: { parentCategoryId: primaryCategory._id, isBlocked: false } }
        ]);
        secondaryCategories.push(...categories);
    }

    // For removing duplicate category name present along different main categories
    for (let i = 0; i < secondaryCategories.length - 1; i++) {
        for (let j = i + 1; j < secondaryCategories.length; j++) {
            if (secondaryCategories[i].name === secondaryCategories[j].name) {
                secondaryCategories.splice(j, 1)
            }
        }
    }

    const categories = [...primaryCategories, ...secondaryCategories]

    res.locals.categories = categories;

    next();

}

const setUserData = asyncHandler(async (req, res, next) => {
    
    const userId = req.session.userId;
    const user = await User.findOne({ _id: userId }).populate("cart.product");
    
    res.locals.user = user;

    next();
})



export { setCategoryData, setUserData }


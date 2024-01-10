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
    const categories = [...primaryCategories, ...secondaryCategories]

    res.locals.categories = categories;

    next();

}

const setUserData = asyncHandler(async (req, res, next) => {
    const userId = req.session.userId;
    const user = await User.findOne({ _id: userId })
    res.locals.user = user;

    next();
})


export { setCategoryData, setUserData }


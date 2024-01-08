import { Category } from "../models/category.model.js";

async function setCommonData(req, res, next) {

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

export { setCommonData }


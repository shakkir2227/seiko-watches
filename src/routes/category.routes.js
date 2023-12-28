import { Router } from "express";
const router = Router();
import {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    editCategory,
}
    from "../controllers/category.controller.js"

router.route("/add-category").post(addCategory)
router.route("/view-category").get(viewCategory)
router.route("/block-category").post(blockCategoryAndSubCategories)
router.route("/edit-category").post(editCategory)

export default router
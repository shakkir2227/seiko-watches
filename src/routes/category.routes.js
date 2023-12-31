import { Router } from "express";
const router = Router();
import {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    editCategory,
}
    from "../controllers/category.controller.js"

router.route("/add").post(addCategory)
router.route("/view").get(viewCategory)
router.route("/block-category").post(blockCategoryAndSubCategories)
router.route("/edit-category").post(editCategory)

export default router
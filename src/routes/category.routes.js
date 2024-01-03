import { Router } from "express";
const router = Router();
import {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    editCategory,
    unblockCategoryAndSubCategories
}
    from "../controllers/category.controller.js"

router.route("/add").post(addCategory)
router.route("/view").get(viewCategory)
router.route("/block").put(blockCategoryAndSubCategories)
router.route("/unblock").put(unblockCategoryAndSubCategories)
router.route("/edit-category").post(editCategory)

export default router
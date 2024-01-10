
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
const router = Router();

import {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    unblockCategoryAndSubCategories,
    updateCategoryController
}
    from "../controllers/category.controller.js"

router.route("/add").post(isAdmin, upload.single("image"), addCategory)
router.route("/view").get(isAdmin,viewCategory)
router.route("/block").put(isAdmin, blockCategoryAndSubCategories)
router.route("/unblock").put(isAdmin, unblockCategoryAndSubCategories)
// router.route("/edit-category").post(isAdmin, editCategory)
router.route("/update/:categoryId").get(isAdmin, updateCategoryController.getUpdatePage)
router.route("/update").post(isAdmin, upload.single("image") ,updateCategoryController.updateCategory)


export default router 

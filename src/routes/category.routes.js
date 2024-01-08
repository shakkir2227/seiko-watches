
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
const router = Router();

import {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    editCategory,
    unblockCategoryAndSubCategories
}
    from "../controllers/category.controller.js"

router.route("/add").post(isAdmin, upload.single("image"), addCategory)
router.route("/view").get(isAdmin,viewCategory)
router.route("/block").put(isAdmin, blockCategoryAndSubCategories)
router.route("/unblock").put(isAdmin, unblockCategoryAndSubCategories)
router.route("/edit-category").post(isAdmin, editCategory)

export default router 

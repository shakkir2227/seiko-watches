
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

// For admin verification
router.use(isAdmin)

router.route("/add").post(upload.single("image"), addCategory)
router.route("/view").get(viewCategory)
router.route("/block").put(blockCategoryAndSubCategories)
router.route("/unblock").put(unblockCategoryAndSubCategories)
router.route("/update/:categoryId").get(updateCategoryController.getUpdatePage)
router.route("/update").post(upload.single("image"), updateCategoryController.updateCategory)


export default router 

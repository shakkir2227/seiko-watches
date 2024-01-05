
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

import {
    addCategory,
    viewCategory,
    blockCategoryAndSubCategories,
    editCategory,
    unblockCategoryAndSubCategories
}
    from "../controllers/category.controller.js"

router.route("/add").post(upload.single("image"), addCategory)
router.route("/view").get(viewCategory)
router.route("/block").put(blockCategoryAndSubCategories)
router.route("/unblock").put(unblockCategoryAndSubCategories)
router.route("/edit-category").post(editCategory)

export default router

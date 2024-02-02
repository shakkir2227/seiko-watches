import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { setCategoryData, setUserData } from "../middlewares/commonData.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
    addProductController,
    blockProductController,
    unblockProductController,
    updateProductController,
    productViewController,
}
    from "../controllers/product.controller.js";

const router = Router();

// Setting common date between requests
router.use(setCategoryData)
router.use(setUserData)

// Adding product by admin
router.route("/add")
    .get(isAdmin, addProductController.renderAddProductPage)
    .post(isAdmin, upload.array("images"), addProductController.handleAddProductForm)

// Block Unblock product by admin
router.route("/block").put(isAdmin, blockProductController)
router.route("/unblock").put(isAdmin, unblockProductController)

// Updating the product by admin
router.get("/update/:id", isAdmin, updateProductController.renderUpdateForm)
router.post("/update", isAdmin, upload.array("images"), updateProductController.updateProduct)

// For viewing the products by admin and user
router.route("/view-admin").get( productViewController.adminProductView)
router.route("/view-admin/apply-filter").get(productViewController.adminProductFilterController)
router.route("/view-user/:productId").get(productViewController.userProductView.getSingleProductView)
router.route("/view-user").get(productViewController.userProductView.getAllProductsView)
router.route("/apply-filter").get(productViewController.userProductView.getFilteredProducts)





export default router;
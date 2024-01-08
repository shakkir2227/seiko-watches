import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { setCommonData } from "../middlewares/commonData.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
    addProductController,
    blockProductController,
    unblockProductController,
    updateProductViewController,
    updateProductController,
    productViewController,


}
    from "../controllers/product.controller.js";

const router = Router();
router.use(setCommonData)

//todo use router.route instead of this


router.route("/add")
    .get(isAdmin, addProductController.renderAddProductPage)
    .post(isAdmin, upload.array("images"), addProductController.handleAddProductForm)

router.put("/block", isAdmin, blockProductController)
router.put("/unblock", isAdmin, unblockProductController)
router.get("/update/:id", isAdmin, updateProductViewController)
router.post("/update", isAdmin, upload.array("images"), updateProductController)
// router.get("/view-admin", adminProductViewController)
router.route("/view-admin").get(isAdmin, productViewController.adminProductView)
router.route("/view-user/:productId").get(productViewController.userProductView.getSingleProductView)
router.route("/view-user").get(productViewController.userProductView.getAllProductsView)


export default router;
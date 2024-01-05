import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
    addProductController,
    blockProductController,
    unblockProductController,
    updateProductViewController,
    updateProductController,
    productViewController,
    addProductViewController,

}
    from "../controllers/product.controller.js";

const router = Router();

//todo use router.route instead of this


router.get("/add", addProductViewController)
router.post("/add", upload.array("images"), addProductController)
router.put("/block", blockProductController)
router.put("/unblock", unblockProductController)
router.get("/update/:id", updateProductViewController)
router.post("/update", upload.array("images"), updateProductController)
// router.get("/view-admin", adminProductViewController)
router.route("/view-admin").get(productViewController.adminProductView)
router.route("/view-user/:productId").get(productViewController.userProductView.getSingleProductView)
router.route("/view-user").get(productViewController.userProductView.getAllProductsView)


export default router;
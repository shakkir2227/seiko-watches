import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
    addProductController,
    blockProductController,
    unblockProductController,
    updateProductViewController,
    updateProductController,
    adminProductViewController,
    addProductViewController,
   
}
    from "../controllers/product.controller.js";

const router = Router();

router.get("/add",  addProductViewController)
router.post("/add", upload.array("images"), addProductController)
router.put("/block", blockProductController)
router.put("/unblock", unblockProductController)
router.get("/update/:id", updateProductViewController)
router.post("/update", upload.array("images"), updateProductController)
router.get("/view-admin", adminProductViewController)


export default router;
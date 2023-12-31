import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
    addProductController,
    blockProductController,
    unblockProductController,
    updateProductController,
    adminProductViewController
}
    from "../controllers/product.controller.js";

const router = Router();

router.post("/create", upload.array("images"), addProductController)
router.put("/block", blockProductController)
router.put("/unblock", unblockProductController)
router.put("/update", updateProductController)
router.get("/view-admin", adminProductViewController)


export default router;
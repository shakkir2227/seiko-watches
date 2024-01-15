import { Router } from "express";
const router = Router();
import { setUserData, setCategoryData } from "../middlewares/commonData.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
    addToCartController,
    viewCartController,
    updateCartController,
    deleteFromCartController,
} from "../controllers/cart.controller.js"

router.use(setUserData)
router.use(setCategoryData)


router.route("/view").get(viewCartController)
router.route("/add").post(addToCartController)
router.route("/update").put(updateCartController)
router.route("/delete").put(deleteFromCartController)

export default router;
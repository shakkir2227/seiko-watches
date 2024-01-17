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

// Setting common data between requests
router.use(setUserData)
router.use(setCategoryData)

// Middleware checking user authrorized
router.use(isAuth)

router.route("/view").get(viewCartController)
router.route("/add").post(addToCartController)
router.route("/update").put(updateCartController)
router.route("/delete").put(deleteFromCartController)

export default router;
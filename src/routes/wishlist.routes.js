import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import { setUserData } from "../middlewares/commonData.middleware.js";
import { addToWishlistController, viewWishlistController } from "../controllers/wishlist.controller.js";

const router = Router();

router.use(setUserData)

router.route("/add").put(addToWishlistController)
router.route("/view").get(viewWishlistController)

export default router;
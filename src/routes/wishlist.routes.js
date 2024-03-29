import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import { setUserData, setCategoryData } from "../middlewares/commonData.middleware.js";
import { addToWishlistController, viewWishlistController, deleteFromWishlistController } from "../controllers/wishlist.controller.js";

const router = Router();

// Setting common data
router.use(setUserData)
router.use(setCategoryData)

router.use(isAuth)

router.route("/add").put(addToWishlistController)
router.route("/view").get(viewWishlistController)
router.route("/delete").delete(deleteFromWishlistController)

export default router;
import { Router } from "express";
const router = Router();
import { setUserData, setCategoryData } from "../middlewares/commonData.middleware.js";

import { userCheckoutController } from "../controllers/order.controller.js";

router.use(setCategoryData)
router.use(setUserData)

router.route("/buy")
    .get(userCheckoutController.renderCheckoutPage)
    .post(userCheckoutController.createOrder)
router.route("/address").post(userCheckoutController.addAddress)

export default router 
import { Router } from "express";
const router = Router();
import { setUserData, setCategoryData } from "../middlewares/commonData.middleware.js";

import { userCheckoutController, userOrderViewController } from "../controllers/order.controller.js";

router.use(setCategoryData)
router.use(setUserData)

router.route("/buy")
    .get(userCheckoutController.renderCheckoutPage)
    .post(userCheckoutController.createOrder)
router.route("/address").post(userCheckoutController.addAddress)
router.route("/view").get(userOrderViewController)

export default router 
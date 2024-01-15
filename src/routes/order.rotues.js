import { Router } from "express";
const router = Router();
import { setUserData, setCategoryData } from "../middlewares/commonData.middleware.js";

import { userCheckoutController } from "../controllers/order.controller.js";

router.use(setCategoryData)

router.route("/buy").get(userCheckoutController.renderCheckoutPage)

export default router 
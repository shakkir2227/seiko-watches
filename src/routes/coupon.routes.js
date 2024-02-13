import { Router } from "express";
import { setUserData } from "../middlewares/commonData.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
    couponViewController,
    addCouponController,
    applyCouponController
} from "../controllers/coupon.controller.js"

const router = Router();

router.use(setUserData)

router.use(isAdmin)

router.route("/view-admin").get(couponViewController.adminView)
router.route("/add").post(addCouponController)
router.route("/apply").put(applyCouponController)

export default router 

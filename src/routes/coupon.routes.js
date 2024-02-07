import { Router } from "express";
import { couponViewController } from "../controllers/coupon.controller.js"

const router = Router();

router.route("/view-admin").get(couponViewController.adminView)

export default router 
import { Router } from "express";
import { setUserData, setCategoryData } from "../middlewares/commonData.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
    userCheckoutController,
    userOrderViewController,
    userOrderDetailedViewController,
    userOrderUpdateControler,
    adminOrderViewController,
    adminOrderDetailedViewController
} from "../controllers/order.controller.js";


const router = Router();

// Setting common data between requests
router.use(setCategoryData)
router.use(setUserData)

router.route("/buy")
    .get(isAuth, userCheckoutController.renderCheckoutPage)
    .post(isAuth, userCheckoutController.createOrder)

router.route("/address").post(isAuth, userCheckoutController.addAddress)
router.route("/view").get(isAuth, userOrderViewController)

//For detailed view of the order
router.route("/view-one").get(isAuth, userOrderDetailedViewController)

router.route("/cancel").put(isAuth, userOrderUpdateControler.cancelOrder)

// ---------ADMIN ORDER ROUTES---------
router.route("/view-admin/:orderId").get(adminOrderViewController)
router.route("/admin-view-one").get(adminOrderDetailedViewController)


export default router 
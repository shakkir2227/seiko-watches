import { Router } from "express";
import { setUserData, setCategoryData } from "../middlewares/commonData.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
    userCheckoutController,
    userOrderViewController,
    userOrderDetailedViewController,
    userOrderUpdateControler,
    adminOrderViewController,
    adminOrderDetailedViewController,
    adminOderUpdateController,
    orderFilterController,
} from "../controllers/order.controller.js";


const router = Router();

// Setting common data between requests
router.use(setCategoryData)
router.use(setUserData)

// ---------USER ORDER ROUTES---------

router.route("/buy")
    .get(isAuth, userCheckoutController.renderCheckoutPage)
    .post(isAuth, userCheckoutController.createOrder)


router.route("/address").post(isAuth, userCheckoutController.addAddress)

// When user select online payment, generating razorpay ORDER ID
router.route("/online-payment").post(userCheckoutController.generateRazorPayOrderId)

router.route("/view").get(isAuth, userOrderViewController)

// For detailed view of the order
router.route("/view-one").get(isAuth, userOrderDetailedViewController)
// For cancelling a particular order
router.route("/cancel").put(isAuth, userOrderUpdateControler.cancelOrder)

// ---------ADMIN ORDER ROUTES---------

router.route("/view-admin/:orderId").get(isAdmin, adminOrderViewController)
router.route("/admin-view-one").get(isAdmin, adminOrderDetailedViewController)
router.route("/update").put(isAdmin, adminOderUpdateController)

router.route("/filter").get(orderFilterController)



export default router
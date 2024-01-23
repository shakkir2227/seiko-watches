import { Router } from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
    adminLoginController,
    blockUserController,
    adminUserDetailsController,
    unBlockUserController,
    adminHomeController,
    adminLogoutController,
    adminReportController


} from "../controllers/admin.controller.js";


const router = Router();

router.route("/login")
    .get(adminLoginController.getLoginPage)
    .post(adminLoginController.loginAdmin)

router.route("/home").get( adminHomeController)

// Block Unblock user
router.route("/block-user").put(isAdmin, blockUserController)
router.route("/unblock-user").put(isAdmin, unBlockUserController)

// Users list view for admin
router.route("/users").get(isAdmin, adminUserDetailsController)

// Generating reports 
router.route("/report/:period").get(adminReportController)

router.route("/logout").get(isAdmin, adminLogoutController)



export default router;
import { Router } from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
    adminLoginController,
    blockUserController,
    adminUserDetailsController,
    unBlockUserController,
    adminHomeController,
    adminLogoutController


} from "../controllers/admin.controller.js";


const router = Router();

router.route("/login")
    .get(adminLoginController.getLoginPage)
    .post(adminLoginController.loginAdmin)
     
router.route("/home").get( adminHomeController)
router.route("/block-user").put(isAdmin, blockUserController)
router.route("/unblock-user").put(isAdmin, unBlockUserController)
router.route("/users").get(isAdmin, adminUserDetailsController)
router.route("/logout").get(adminLogoutController)



export default router;
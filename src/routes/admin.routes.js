import { Router } from "express";
import {
    adminLoginController
    , blockUserController,
    adminUserDetailsController,
    unBlockUserController,
    adminLoginViewController,
    adminHomeController
 
} from "../controllers/admin.controller.js";


const router = Router();

router.route("/login").get(adminLoginViewController)
router.route("/login").post(adminLoginController)
router.route("/home").get(adminHomeController)
router.route("/block-user").put(blockUserController)
router.route("/unblock-user").put(unBlockUserController)
router.route("/users").get(adminUserDetailsController)


export default router;
import { Router } from "express";
import {
    registerController,
    userLoginController,
    verifyController,
    userResendOTPController,
    userHomeController,
    userAccountController,
    userLogoutController
} from "../controllers/user.controller.js"

import { setCategoryData, setUserData } from "../middlewares/commonData.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(setCategoryData);
router.use(setUserData);

// router.route("/register").get()
router.route("/register")
    .get(registerController.getRegisterPage)
    .post(registerController.registerUser)

router.route("/verify")
    .get(verifyController.getverifyPage)
    .post(verifyController.verifyUser)

router.route("/resend-OTP").get(userResendOTPController)

router.route("/login")
    .get(userLoginController.getLoginPage)
    .post(userLoginController.loginUser)

router.route("/account")
    .get(isAuth, userAccountController)

router.route("/logout").get(userLogoutController)

router.route("/home").get(userHomeController)


export default router;
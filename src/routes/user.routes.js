import { Router } from "express";
import { setCategoryData, setUserData } from "../middlewares/commonData.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
    registerController,
    userLoginController,
    verifyController,
    userResendOTPController,
    userHomeController,
    userAccountController,
    userAddressController,
    userLogoutController,
} from "../controllers/user.controller.js"


const router = Router();

// Setting commondata betwen requests
router.use(setCategoryData);
router.use(setUserData);


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
    .get(isAuth, userAccountController.renderAccountDetailsPage)
    .post(isAuth, userAccountController.updateAccount)

router.route("/home").get(userHomeController)

// Address routes
router.route("/address/add")
    .get(isAuth, userAddressController.addAddressController.renderAddAddressPage)
    .post(isAuth, userAddressController.addAddressController.handleAddAddressForm)

router.route("/address/change-default").put(isAuth, userAddressController.changeDefaultAddressController)
router.route("/address/update/:addressId").get(isAuth, userAddressController.updateAddress.renderUpdateAddressPage)
router.route("/address/update").post(isAuth, userAddressController.updateAddress.handleUpdateAddressForm)
router.route("/address/block").put(isAuth, userAddressController.blockAddress)

router.route("/logout").get(isAuth, userLogoutController)



export default router;
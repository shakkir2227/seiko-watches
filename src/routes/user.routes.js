import { Router } from "express";
import { registerController, verifyController, userHomeController } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();


// router.route("/register").get()
router.route("/register")
    .get(registerController.getRegisterPage)
    .post(registerController.registerUser)


router.route("/verify")
    .get(verifyController.getverifyPage)
    .post(verifyController.verifyUser)


router.route("/home").get(userHomeController)

export default router;
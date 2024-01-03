import { Router } from "express";
import { registerUser, verifyUser, userHomeController } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();


router.route("/register").get()
router.route("/register").post(registerUser)
router.route("/home").get(userHomeController)

router.route("/verify").post(verifyUser)


export default router;
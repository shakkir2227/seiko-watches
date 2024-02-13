import { Router } from "express";
import { setCategoryData } from "../middlewares/commonData.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
    offerViewController,
    addOfferController,
    deleteOfferController
} from "../controllers/offer.controller.js"

const router = Router();

router.use(setCategoryData)

router.use(isAdmin)

router.route("/view").get(offerViewController)
router.route("/add").post(addOfferController)
router.route("/delete").delete(deleteOfferController)

export default router;
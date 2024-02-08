import { Router } from "express";
import { setCategoryData } from "../middlewares/commonData.middleware.js";
import {
    offerViewController,
    addOfferController
} from "../controllers/offer.controller.js"

const router = Router();

router.use(setCategoryData)

router.route("/view").get(offerViewController)
router.route("/add").post(addOfferController)

export default router;
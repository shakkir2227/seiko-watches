import { Router } from "express";
import {
    offerViewController,
    addOfferController
} from "../controllers/offer.controller.js"

const router = Router();

router.route("/view").get(offerViewController)
router.route("/add").post(addOfferController)

export default router;
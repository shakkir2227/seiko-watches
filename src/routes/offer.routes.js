import { Router } from "express";
import {
    offerViewController
} from "../controllers/offer.controller.js"

const router = Router();

router.route("/view").get(offerViewController)

export default router;
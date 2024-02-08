import { Router } from "express";

const router = Router();

router.route("/view").get(offerViewController)

export default router;
import { asyncHandler } from "../utils/asyncHandler.js"

const offerViewController = asyncHandler(async (req, res) => {
    return res.render("page-offers.ejs")
})


export {
    offerViewController
} 
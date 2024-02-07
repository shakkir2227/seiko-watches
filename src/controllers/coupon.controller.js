import { asyncHandler } from "../utils/asyncHandler.js"

const couponViewController = {
    adminView: asyncHandler(async(req, res) => {
        return res.render("page-coupon.ejs")
    })
}

const addCouponController = asyncHandler(async(req, res) => {
    
})

export {
    couponViewController

}
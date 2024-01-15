import { asyncHandler } from "../utils/asyncHandler.js"

const userCheckoutController = {

    renderCheckoutPage: asyncHandler(async(req, res) => {
        return res.render("shop-checkout.ejs",{categories: res.locals.categories})
    })
}

export {
    userCheckoutController
}
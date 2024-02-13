import { asyncHandler } from "../utils/asyncHandler.js"
import { Coupon } from "../models/coupon.model.js"
import { User } from "../models/user.model.js"
import { orderFilterController } from "./order.controller.js"


const couponViewController = {
    adminView: asyncHandler(async (req, res) => {

        // Display not expired coupons
        const allCoupons = await Coupon.aggregate([
            {
                $match: {
                    expiryDate: {
                        $gte: new Date()
                    }
                }
            },
            {
                $project: {
                    code: 1,
                    discountPercent: 1,
                    minimumOrderAmount: 1,
                    maxDiscountAmount: 1,
                    expiryDate: {
                        $dateToString: {
                            format: "%d-%m-%Y",
                            date: "$expiryDate"
                        }
                    }
                }
            }
        ])

        const errorMessage = req.flash("error")[0]
        const successMessage = req.flash('success')[0];

        return res.render("page-coupon.ejs", { allCoupons, errorMessage, successMessage })
    })
}

const addCouponController = asyncHandler(async (req, res) => {
   
    let { code, discountPercent, minimumOrderAmount, maxDiscountAmount, expiryDate } = req.body;

    discountPercent = parseInt(discountPercent);
    minimumOrderAmount = parseInt(minimumOrderAmount)
    maxDiscountAmount = parseInt(maxDiscountAmount)
    expiryDate = new Date(expiryDate)
    expiryDate.setUTCHours(23, 59, 59, 999);
  

    // Before creating coupon, check any coupon exist with similar code
    const existingCoupons = await Coupon.aggregate([
        {
            $match: {
                code
            }
        }
    ])

    if (existingCoupons.length > 0) {
  
        req.flash("error", `A coupon with this code already exists. Please choose a different code.`)
        return res.redirect("/coupon/view-admin")
    }

    const coupon = await Coupon.create({
        code,
        discountPercent,
        minimumOrderAmount,
        maxDiscountAmount,
        expiryDate
    })

    req.flash('success', `Coupon ${coupon.code} created successfully`);
    return res.redirect("/coupon/view-admin")

})

const applyCouponController = asyncHandler(async (req, res) => {

    const user = res.locals.user

    let { couponInput, totalAmountBeforeDiscount } = req.body
    totalAmountBeforeDiscount = totalAmountBeforeDiscount.replace("undefined₹", "")
    totalAmountBeforeDiscount = parseInt(totalAmountBeforeDiscount)


    const coupon = await Coupon.aggregate([
        {
            $match: {
                code: couponInput
            }
        }
    ])

    // If no coupon exist with this code, send an error !!
    if (coupon.length === 0) {

        return res.status(404).json({
            "message": "The entered coupon does not exist. Please check the coupon code and try again."
        })
    }

    const usedCoupon = await User.aggregate([
        {
            $match: {
                _id: user._id,
                coupons: {
                    $elemMatch: {
                        $eq: coupon[0]._id
                    }
                }

            }
        }
    ])

    if (usedCoupon.length > 0) {
       
        return res.status(409).json({
            "message": "The entered coupon has already been used. Each coupon can only be used once per user."
        })
    }

    // Before applying the coupon, checking the total amount is eligible 
    // for applying this coupon using coupon's min order amount

    if (totalAmountBeforeDiscount < coupon[0].minimumOrderAmount) {

        return res.status(400).json({
            "message": "The total amount in your cart does not meet the minimum requirement for applying this coupon. Please add more items to meet the minimum amount"
        })
    }


    let discountAmount = (totalAmountBeforeDiscount * (coupon[0].discountPercent) / 100)

    if (discountAmount > coupon[0].maxDiscountAmount) {
        discountAmount = coupon[0].maxDiscountAmount;
    }

    const totalAmountAfterDiscount = totalAmountBeforeDiscount - discountAmount

    return res.status(200).json({ discountAmount, totalAmountAfterDiscount, coupon })


})

export {
    couponViewController,
    addCouponController,
    applyCouponController
}
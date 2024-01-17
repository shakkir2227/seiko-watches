import { asyncHandler } from "../utils/asyncHandler.js"
import adminValidationSchema from "../utils/validation/admin.validation.js";
import { User } from "../models/user.model.js"
import { Order } from "../models/order.model.js";



const adminLoginController = {

    getLoginPage: asyncHandler(async (req, res) => {
        if (req.session.adminEmail) {
            return res.redirect("/admin/home")
        }
        return res.render("page-account-login.ejs")
    }),

    loginAdmin: asyncHandler(async (req, res) => {
        //take email and password form req.body
        //validate it 
        //match it with process.env.adminlogin credentials
        //if correct render home page
        //if not send invalid credetnials

        const { email, password } = req.body;
        const { error } = adminValidationSchema.validate({ email, password })

        if (error) {
            let trimmedMessage = error.message.replace(/^Validation error: /, '');
            return res.render("page-account-login.ejs", { message: trimmedMessage })
        }

        if (!(email === process.env.ADMIN_EMAIL) ||
            !(password === process.env.ADMIN_PASSWORD)
        ) {
            return res.render("page-account-login.ejs", { message: "Invalid credentials" })
        }

        req.session.adminEmail = process.env.ADMIN_EMAIL;
        return res.redirect("/admin/home")
    })
}



const adminHomeController = asyncHandler(async (req, res) => {

    const orders = await Order.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            },

        },
        {
            $project: {
                user: 1,
                totalAmount: 1,
                paymentMethod: 1,
                paymentStatus: 1,
                createdAt: {
                    $dateToString: {
                        format: "%d-%m-%Y",
                        date: "$createdAt"
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    console.log(orders);

    return res.render("page-admin-home.ejs", {orders})
})

const blockUserController = asyncHandler(async (req, res) => {

    //take user id from body
    //check if it exist or not
    //if not display user doesnot exist message
    //else check if user is already blocked 
    //if it is, then show already blocked nothing done
    //else make him block,

    const { userId } = req.body;
    const user = await User.findOne(
        { $and: [{ _id: userId }, { isVerified: true }] }
    )
    if (!user) {
        return res.send(`User not found. 
        Please check the provided details and try again.`);
    }

    if (user.isBlocked) {
        return res.send(`User status remains unchanged. 
        ${user.name} is already blocked as per your request.`)
    }

    user.isBlocked = true;
    const blockeduser = await user.save()
    return res.redirect(303, "/admin/users")
})

const unBlockUserController = asyncHandler(async (req, res) => {
    
    //take user id from body
    //check if it exist or not
    //if not display user doesnot exist message
    //else check if user is already blocked 
    //if it is, then show already blocked nothing done
    //else make him block
    const { userId } = req.body;

    const user = await User.findOne(
        { $and: [{ _id: userId }, { isVerified: true }] }
    )

    if (!user) {
        return res.send(`User not found. 
        Please check the provided details and try again.`);
    }

    if (!user.isBlocked) {
        return res.send(`User status remains unchanged. 
        ${user.name} is already Unblocked as per your request.`)
    }


    user.isBlocked = false;
    const blockeduser = await user.save()
    // return res.send(`user ${blockeduser.name} has been successfully unblocked.`)
    return res.redirect(303, "/admin/users")
})


const adminUserDetailsController = asyncHandler(async (req, res) => {

    const users = await User.find({ isVerified: true });
    return res.render("page-users-list.ejs", { users })
})

const adminLogoutController = asyncHandler(async (req, res) => {
    req.session.adminEmail = null;
    res.redirect("/admin/login")
})
 


export {
    adminLoginController,
    blockUserController,
    adminUserDetailsController,
    unBlockUserController,
    adminHomeController,
    adminLogoutController

}


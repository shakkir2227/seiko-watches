import { asyncHandler } from "../utils/asyncHandler.js"
import adminValidationSchema from "../utils/validation/admin.validation.js";
import { User } from "../models/user.model.js"

const adminLoginViewController = asyncHandler(async (req, res) => {
    return res.render("page-account-login.ejs")

})

const adminLoginController = asyncHandler(async (req, res) => {
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

    return res.redirect("/admin/home")
})

const adminHomeController = asyncHandler(async (req, res) => {
    
    return res.render("page-admin-home.ejs")
})

const blockUserController = asyncHandler(async (req, res) => {
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



export {
    adminLoginController,
    blockUserController,
    adminUserDetailsController,
    unBlockUserController,
    adminLoginViewController,
    adminHomeController,


}


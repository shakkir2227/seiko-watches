import { asyncHandler } from "../utils/asyncHandler.js"
import adminValidationSchema from "../utils/validation/admin.validation.js";

const loginAdmin = asyncHandler(async (req, res) => {
    //take email and password form req.body
    //validate it 
    //match it with process.env.adminlogin credentials
    //if correct render home page
    //if not send invalid credetnials

    const { email, password } = req.body;
    const { error } = adminValidationSchema.validate({email, password})

    if (error) {
        return res.send(error.message)
    }

    if ((email === process.env.ADMIN_EMAIL)
        &&
        password === process.env.ADMIN_PASSWORD
    ){
        return res.send("Welcome to dashboard")
    }

    return res.send("Invalid Credentials")
})

export { loginAdmin }
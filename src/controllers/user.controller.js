import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import userValidationSchema from "../utils/validation/user.validation.js";
import { tranporter, Mailgenerator } from "../utils/nodemailer.js";


const registerController = {

    getRegisterPage: asyncHandler(async (req, res) => {

        const errorMessage = req.flash("error")[0]
        const successMessage = req.flash('success')[0];
        return res.render("page-account-register.ejs", { errorMessage, successMessage })

    }),


    registerUser: asyncHandler(async (req, res) => {

        //taking fields from body
        //validate the fields
        //check if any user exists with this mobilenumber or email
        //if not save the document as not verified
        // and send them the otp
        //if exists, check if them verified or not
        //if verified, display ALREADY REGISTERED
        //else proceed to sendOTP

        const { name, email, mobileNumber, password } = req.body;

        //Using JOI for validation
        const { error } = userValidationSchema.validate({ name, email, password, mobileNumber });
        if (error) {
            req.flash('error', `${error.message}`);
            return res.redirect("/user/register")
        }

        const existedUser = await User.findOne({
            $or: [{ email }, { mobileNumber }]
        })


        if (!existedUser) {
            //saving the user as not verified
            const user = await User.create({
                name,
                email,
                mobileNumber,
                password,
                isVerified: false
            });


            //creating OTP to embed in the Email
            let OTP = Math.floor(Math.random() * 10 ** 6)

            //mailgen
            let response = {
                body: {
                    name,
                    action: {
                        instructions: 'Use this OTP to get started with Us, :',
                        button: {
                            color: '#48cfad', // Optional action button color
                            text: `${OTP}`,

                        }
                    }
                }
            }
            let mail = Mailgenerator.generate(response)
            let message = {
                from: process.env.ADMIN_EMAIL,
                to: email,
                subject: "Verify your email address",
                html: mail,
            }

            tranporter.sendMail(message).then(() => {
                console.log("OTP sent successfully");
            })

            req.session.OTP = OTP;
            req.session.userId = user._id;

            console.log(OTP);

            // return res.send("Verification Email has been sent")
            req.flash('success', `Verification Email has been sent`);
            return res.redirect("/user/verify")
        };

        if (!existedUser.isVerified) {
            let OTP = Math.floor(Math.random() * 10 ** 6)

            let response = {
                body: {
                    name,
                    action: {
                        instructions: 'Use this OTP to get started with Us, :',
                        button: {
                            color: '#48cfad', // Optional action button color
                            text: `${OTP}`,

                        }
                    }
                }
            }
            let mail = Mailgenerator.generate(response)
            let message = {
                from: process.env.ADMIN_EMAIL,
                to: existedUser.email,
                subject: "Verify your email address",
                html: mail
            }

            tranporter.sendMail(message).then(() => {
                console.log("OTP sent successfully");
            })

            req.session.OTP = OTP;
            req.session.userId = existedUser._id;

            console.log(OTP);

            req.flash('success', `Verification Email has been sent`);
            return res.redirect("/user/verify")
        };

        // return res.send("User with this Email or Mobile Number already exists!!")

        req.flash('error', `User with this Email or Mobile Number already exists!!`);
        return res.redirect("/user/register")

    })
}



const verifyController = {

    getverifyPage: asyncHandler(async (req, res) => {

        const errorMessage = req.flash("error")[0]
        const successMessage = req.flash('success')[0];
        return res.render("page-account-verify.ejs", { errorMessage, successMessage })
    }),

    verifyUser: asyncHandler(async (req, res) => {

        //Checking the user got deleted or not
        //if deleted display OTP EXPIRED !!
        //taking otp from route params
        //match it with session OTP
        //if match, make him verified
        //remove the otp from session
        //and add userid in session
        //render HOME page;
        //else display OTP not match message

        const userId = req.session.userId;
        const user = await User.findOne({ _id: userId });

        if (!user) {
            req.flash('error', `OTP expired. Please register again`);
            return res.redirect("/user/verify")
        }

        const OTP = req.session.OTP
        console.log(OTP);

        const userEnteredOTP = req.body.OTP;
        console.log(userEnteredOTP);

        if (userEnteredOTP != OTP) {
            req.flash('error', `Invalid OTP`);
            return res.redirect("/user/verify")
        }

        await User.updateOne({ _id: userId }, { $set: { isVerified: true } })
        const verifiedUser = await User.findOne({ _id: userId });
        req.session.OTP = null;

        req.session.user_id = verifiedUser._id;
        return res.redirect("/user/home")

    })
}


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { error } = userValidationSchema.validate({ email, });
    if (error) {
        res.send(error.message)
    }
    const user = await User.findOne({ email });
    if (!user) {
        res.send("This is not a valid Email address")
    }





})


const userHomeController = asyncHandler(async (req, res) => {
    //taking userId from session. find the specific user
    //find the new products and display it
    //find the top and it's sub category only
    //and display it on the page, with some appropriate cat-images
    //last part of the section is for youtube videos

    const userId = req.session.userId 
    const user = await User.findOne({_id:userId})
    

   
    
    return res.render("user.home.ejs")

})



export {

    userHomeController,
    registerController,
    verifyController

}
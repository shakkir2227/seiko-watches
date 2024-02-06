
// user auth
const isAuth = (req, res, next) => {

    const user = res.locals.user;

    if (!user) {
        return res.redirect(307, "/user/login")
    }

    if (user?.isBlocked) {
        req.session.userId = null;
        req.flash('error', `We regret to inform you that your account has been temporarily suspended or blocked by the administrator. If you have any concerns or would like to appeal this decision, please contact our support team at [seiko_admin@mail.com]. Thank you for your understanding.`);
        return res.redirect("/user/login")
    }

    if (!user.isVerified) {
        req.flash('error', `Welcome back! It seems like your account is not verified. Please check your email for a verification link to complete the process and enjoy full access.`);
        return res.redirect("/user/verify")
    }

    next();

}


// admin auth
const isAdmin = (req, res, next) => {

    if (!req.session.adminEmail) {
        return res.redirect("/admin/login")
    }

    next();

}

export { isAuth, isAdmin }


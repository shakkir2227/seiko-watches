
// user auth
const isAuth = (req, res, next) => {
    if(req.session.isBlocked) {
        req.flash('error', `We regret to inform you that your account has been temporarily suspended or blocked by the administrator. If you have any concerns or would like to appeal this decision, please contact our support team at [seiko_admin@mail.com]. Thank you for your understanding.`);
        return res.redirect("/user/login")
    }

    if (!req.session.userId) {
        return res.redirect("/user/login")
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


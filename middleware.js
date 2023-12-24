
module.exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated() || (req.user )) {
        return next();
    }

    req.flash("error", "You need to login first!!");
    res.redirect("/login");
};

const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const {saveRedirectUrl} = require("../middleware.js")


router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({})
    res.render("Listing/index.ejs", { allListings })
}))



router.get("/signup", (req, res) => {
    res.render("User/signUp.ejs");
})


router.post("/signup", wrapAsync(async (req, res) => {
    try {
        let { username, email, password } = req.body;
        let newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        // console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust")
            res.redirect("/listings");
        })
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
}))


router.get("/login", (req, res) => {
    res.render("User/login.ejs");
})


router.post("/login", saveRedirectUrl , passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust.");
    // console.log(res.locals.redirectUrl)
    let redirectUrl = res.locals.redirectUrl || "/listings"
    res.redirect(redirectUrl);
})


router.get("/logout", (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out");
        res.redirect("/listings");
    })
})

module.exports = router;

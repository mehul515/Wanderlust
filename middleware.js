const Listing = require("./models/listing.js")
const Review = require("./models/review.js")

module.exports = isLoggedIn = async(req, res, next) => {
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You Must be logged in to create a listing!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = async (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

// module.exports.isReviewAuthor = async (req, res, next) => {
//     const {id, reviewId} = req.params
//     let review = await Review.findById(reviewId);
//     console.log(listing.owner,"       ", res.locals.currUser._id)
//     if(!review.author.equals(res.locals.currUser._id)){
//         req.flash("error", "You don't have permission to delete this review!");
//         return res.redirect(`/listings/${id}`)
//     }
//     next();
// }


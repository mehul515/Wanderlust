const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js")
const Listing = require("../models/listing.js")
const Review = require("../models/review.js")
const ExpressError = require("../utils/ExpressError.js")
const isLoggedIn = require("../middleware.js");
const isReviewAuthor = require("../middleware.js");
const review = require("../models/review.js");

//Reviews
router.post("/", isLoggedIn, wrapAsync( async(req, res) => {
    let listing = await Listing.findById(req.params.id );
    let newReview = new Review(req.body.review);
    // console.log(req.body.review)
    if(!req.body.review.rating){
        throw new ExpressError(400, "Invalid Comment")
    }
    if(!req.body.review.comment){
        throw new ExpressError(400, "Comment cannot be empty!!!")
    }
    newReview.author = req.user._id;
    // console.log(newReview);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
}))

//delete review route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(async(req, res) => {
    let {id , reviewId} = req.params;
    // console.log(id ,"     ",reviewId);
    // console.log(review ,  "      ", res.locals.currUser._id)
    let review = await Review.findById(reviewId);
    // console.log(review)
    if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error", "You can not delete this review!");
        return res.redirect(`/listings/${id}`);
    }
    await Listing.findByIdAndUpdate(id, {$pull : {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId)
    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
}))

module.exports = router;
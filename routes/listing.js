const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js")
const ExpressError = require("../utils/ExpressError.js")
const Listing = require("../models/listing.js")
const User = require("../models/user.js")
const isLoggedIn = require("../middleware.js")
const multer = require('multer')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const { storage } = require("../cloudConfig.js")
const upload = multer({ storage })


// get all listings
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({})
    res.render("Listing/index.ejs", { allListings })
}))


//Read route
router.get("/new", isLoggedIn, (req, res) => {

    res.render("Listing/new.ejs")
})


//create route
router.post("/", isLoggedIn, upload.single("image"), wrapAsync(async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.location,
        limit: 1
    })
    .send();

    let url = req.file.path;
    let filename = req.file.filename;
    // console.log(url, "   ", filename)
    let newListing = req.body;
    // console.log(newListing);
    if (!newListing.title) {
        throw new ExpressError(400, "Title is missing!")
    }
    if (!newListing.description) {
        throw new ExpressError(400, "Description is missing!")
    }
    if (!newListing.price) {
        throw new ExpressError(400, "Price is missing!")
    }
    if (!newListing.location) {
        throw new ExpressError(400, "Location is missing!")
    }
    if (!newListing.country) {
        throw new ExpressError(400, "Country is missing!")
    }
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;
    newListing.category = newListing.category;
    await Listing.create(newListing);
    // console.log(savedListing);
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}))


// get listings by category
router.get("/category/:category", wrapAsync(async(req, res) => {
    let {category} = req.params;
    const categoryListings = await Listing.find({"category": `${category}`})
    res.render("Listing/category.ejs", { categoryListings })
    // res.send("done");
}))


// get single listing
router.get("/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: "author" })
    if (!listing) {
        req.flash("error", "The listing you requested for does not exist!!")
        res.redirect("/listings")
    }
    const owner = await User.findById(listing.owner)
    // console.log(owner);
    res.render("Listing/show.ejs", { listing, owner })
}))



// get listing update form
router.get("/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to edit this listing!");
        return res.redirect(`/listings/${id}`)
    }
    res.render("Listing/edit.ejs", { listing })
}))


// Update Route
router.put("/:id", isLoggedIn, upload.single("image"), wrapAsync(async (req, res) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.location,
        limit: 1
    })
    .send();
    const { id } = req.params
    const updatedListing = await req.body;
    // console.log(updatedListing, "         ", id);
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to edit this listing!");
        return res.redirect(`/listings/${id}`)
    }
    updatedListing.geometry = response.body.features[0].geometry;
    listing = await Listing.findByIdAndUpdate(id, updatedListing)
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename }
        
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`)

}))


// Delete Route
router.delete("/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to Delete this listing!");
        return res.redirect(`/listings/${id}`)
    }
    let deletedListing = await Listing.findByIdAndDelete(id)
    // console.log(deletedListing)
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings")
}))


module.exports = router;
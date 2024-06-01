const express = require("express")
const mongoose = require("mongoose")
const Listing = require("./models/listing.js")
const Review = require("./models/review.js")
const path = require("path")
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const app = express();
const ejs = require("ejs")
const wrapAsync = require("./utils/wrapAsync.js")
const ExpressError = require("./utils/ExpressError.js")
if(process.env.NODE_ENV != "production"){
    require('dotenv').config()
}

const dbUrl = process.env.MONGO_URI ;
const port = 8080;

const session = require("express-session")
const MongoStore = require('connect-mongo');
const flash = require("connect-flash")
const passport = require("passport")
const LocalStrategy = require("passport-local")
const User = require("./models/user.js")


app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate)
app.use(express.static(path.join(__dirname, "/public")))


async function main(){
    await mongoose.connect(dbUrl)
}

main().then(()=>{
    console.log("Connected Successfully...")
}).catch((err) => {
    console.log(err)
})


const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60
})

store.on("error", ()=>{
    console.log("ERROR IN MONGO SESSION STORE",err);
})

const sessionOptions = {
    store:store,
    secret : process.env.SECRET,
    resave: false,
    saveUninitialized : true,
    cookie: {
        expires : Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge : 1000 * 60 * 60 * 24 * 7,
        httpOnly : true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")
const user = require("./models/user.js")
const { log } = require("console")

app.get("/",(req, res)=>{
    res.redirect("/listings");
}

app.use("/listings", listingRouter)
app.use("/listings/:id/reviews", reviewRouter)
app.use("/", userRouter)


app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!!!"));
})

app.use((err, req, res, next) => {
    let {status=500, message="Something Went Wrong!!!" } = err;
    res.render("Listing/error.ejs", {message})
})


app.listen(port || 3000, () => {
    console.log(`Server Runnning at port ${port}...`);
})

const express = require('express');
const flash = require('connect-flash');
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const colors = require("colors");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const PORT=process.env.PORT ;
const session = require('express-session');  
const cookieParser = require('cookie-parser');  
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User=require("./models/User"); 
const FacebookStrategy=require("passport-facebook").Strategy;
const {isLoggedIn}=require("./middleware");
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_ID);
var GoogleStrategy = require('passport-google-oauth20').Strategy;

// mongoose.connect("mongodb://127.0.0.1:27017/ecommerceWebsite")
mongoose.connect(process.env.MONGODB_URL
, {
  poolSize: 10, // Adjust as needed
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=> console.log("db connected sucessfully".yellow))
.catch((err)=> console.log(err));


const sessionConfig = {

    secret: 'weneedagoodsecret', 
    resave: false,
    saveUninitialized: true,
    cookie : {
      expire : Date.now() + 7*24*60*60*1000
    }

}


const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
  

app.engine("ejs", ejsMate); 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({extended:true}))
app.use(methodOverride("_method")); 
app.use(cookieParser('keyboardcat'));
app.use(session(sessionConfig)); 
app.use(passport.session());
app.use(passport.authenticate('session'));
app.use(flash());
app.use(function (req, res, next) {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser=req.user;
    next(); 
})
app.use("/products", productRoutes);
app.use( reviewRoutes);
app.use( authRoutes);
app.use( cartRoutes);


passport.use(new LocalStrategy(User.authenticate()));

passport.use(new GoogleStrategy({
  clientID:process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/oauth2/redirect/google',
  scope: ['profile']
  },
  function(accessToken, refreshToken, profile, cb) {

  const newUser = new User({ googleId: profile.id , username:profile.displayName , identity:'seller'  });
  newUser.save()
  .then(user => {
    return cb(null, user);
  })
  .catch(err => {
    return cb(err, null);
  });

    
  }
));

 
app.get("/",(req,res)=>{
  res.render("products/homePage");
})
app.get("/loginViaGoogle",(req,res)=>{
  res.render("products/googleIdentity")
})
app.post("/loginViaGoogle",async (req,res)=>{
  const {identityInput,googleid}=req.body;
  await User.updateOne(
    {googleId:googleid},
    {$set: { identity: identityInput }}
  )
  const updatedUser=await User.find({googleId:googleid});
  console.log(updatedUser);


  res.redirect("/")
})
app.post('/:IDD/create-checkout-session',isLoggedIn, async (req, res) => {
  const {IDD}=req.params;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      { 
        price_data: {
          currency: 'usd', 
          product_data: {
            name: 'T-shirt', 
          },
          unit_amount: 1000, 
        }, 
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/success`,
    cancel_url: `${process.env.BASE_URL}/products/${IDD}/cart`,
  });

  res.redirect(303, session.url); 
});


app.get('/oauth2/redirect/google', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureFlash: true,
    successFlash:true 
  }),
  function(req, res) {
    req.flash('success', `Welcome ${req.user.username}`); 
  res.redirect('/loginViaGoogle');
  });

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(user, cb) {
  cb(null, user);
});


app.listen(PORT, () => 
    console.log("Server listening at port".blue ,`${process.env.BASE_URL}`.red)
)





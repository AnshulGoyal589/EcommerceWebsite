const express = require("express");
const router =  express.Router();
const Product = require("../models/Product");
const {isLoggedIn}=require("../middleware");


const Review = require("../models/Review");
const app = express();
app.use(express.urlencoded({ extended: true }));


function checkForNullCharacters(obj) {
    for (let key in obj) {
        if (obj[key]==="") {
          return false; 
        }
    }
    return true; 
  }
  

router.get("/", async (req,res)=>{   
    
    const products=await Product.find({}).maxTimeMS(20000).exec();
    res.render("products/homeTemp",{products});
})
router.post("/specific", async (req,res)=>{   
    
    const {input}=req.body;
    const products=await Product.find({name:input});
    res.render("products/homeTemp",{products});
})
router.get("/sort/:basis", async (req,res)=>{   
    const {basis}=req.params;
    const products = await Product.find().sort(basis);
    res.render("products/homeTemp",{products});
})
router.post("/new", async (req,res)=>{  
    const product =req.body;

    if (checkForNullCharacters(product)) { 
        await Product.insertMany(product);
        req.flash('success','Item added to the cart Successfully!!');
    }else {
        req.flash('error','ERROR in adding item to the cart due to insuficient info!!');
    }
    res.redirect("/products");
})
router.get("/add",isLoggedIn, (req,res)=>{    
    console.log("OOOOOOOOOOOOOOOOOOOOOO:    ",req.isAuthenticated);       
    res.render("products/addTemp");
})
router.delete("/:productId",isLoggedIn ,async (req,res)=>{
    const {productId}=req.params; 
    await Product.findByIdAndDelete( productId );
    const products=await Product.find({});
    req.flash('success','Item deleted from the cart successfully!');
    res.redirect("/products");
})
router.get("/:productId", async(req,res)=>{ 
    const {productId} = req.params; 
    const product = await Product.findById(productId).populate("review");
    res.render("products/show", {product})
})
router.get("/:productId/edit",isLoggedIn, async (req,res)=>{ 
    const {productId}=req.params;
    const product = await Product.findById( productId );
    res.render("products/update",{product});
})
router.patch("/:productId", async (req,res)=>{
    const {productId}=req.params;
    const product=req.body;
    await Product.findByIdAndUpdate(productId,product);
    req.flash("success",`Details of ${product.name} have been updated suucessfully!!`);
    res.redirect(`/products/${productId}`);
})

module.exports = router
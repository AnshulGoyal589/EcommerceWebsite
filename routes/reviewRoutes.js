const express = require("express");
const router =  express.Router();
const Review = require("../models/Review");
const Product = require("../models/Product");
const app = express();
app.use(express.urlencoded({ extended: true }));

 
router.post("/products/:productId/review", async(req,res)=>{

    const {productId} = req.params;
    const {rating, text}= req.body; 
    let owner="Anonymous";
    if(req.user){
        owner=req.user.username;
    }
    const product = await Product.findById(productId);
    const revieww = await Review.create({ rating , text,owner});
    product.review.push(revieww);

    await product.save();
 
    res.redirect(`/products/${productId}`);

})

module.exports = router
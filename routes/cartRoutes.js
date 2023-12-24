const express=require("express");
const router=express.Router();
const Product=require("../models/Product");
const User=require("../models/User");
const {isLoggedIn}=require("../middleware");




router.get("/products/:productId/:userId/cart",isLoggedIn,async (req,res)=>{

    const {productId}=req.params;
    const {userId}=req.params;
    const product=await Product.findById(productId);
    const user=await User.findById(userId); 

    const isPresent=user.cart.some(item => item.id.toString() === productId);

    if(!isPresent){
        const newItem={ 
            id:productId,
            img:product.img,
            name:product.name,
            price:product.price,
            count:1,
        }
        user.cart.push(newItem);
        await user.save();
    }else{
        const index = user.cart.findIndex(item => item.id.toString() === productId);
        user.cart[index].count+=1;
    }
    (user.totalItems)+=1;
    (user.totalCost)+=product.price;
    await user.save();


    res.redirect(`/products/${userId}/cart`);
    
})
router.get("/products/:userId/cart",isLoggedIn,async (req,res)=>{
    const {userId}=req.params;
    const user=await User.findById(userId); 
    const IDD=userId;
    
    res.render("cart/cartTemp",{user,IDD});
})
router.get("/products/user/:updatedValue/:itemId/cart",isLoggedIn, async (req,res)=>{
    const userId=req.user._id;
    const {itemId}=req.params;
    const {updatedValue}=req.params;
    const user=await User.findById(userId); 
    const indexToRemove = user.cart.findIndex(item => item.id.toString() === itemId);
    (user.totalItems)+=(updatedValue-user.cart[indexToRemove].count);
    (user.totalCost)+=((updatedValue-user.cart[indexToRemove].count)*user.cart[indexToRemove].price);
    user.cart[indexToRemove].count = updatedValue;
    user.save();
    res.redirect(`/products/${userId}/cart`); 
})
router.get("/products/:itemId/delete",isLoggedIn,async (req,res)=>{
    const {itemId}=req.params;
    const userId=req.user._id;
    const user=await User.findById(userId);
    const indexToRemove = user.cart.findIndex(item => item.id.toString() === itemId);
    user.totalItems-=user.cart[indexToRemove].count;
    user.totalCost-=user.cart[indexToRemove].count*user.cart[indexToRemove].price;
    if(indexToRemove !== -1){
        user.cart.splice(indexToRemove, 1);
    }
    await user.save();
    res.redirect(`/products/${userId}/cart`);

})

module.exports=router;
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const env = require('dotenv');
const cloudinary = require('cloudinary');
require('../models/Item');
const upload = require('../middlewares/multer');
require('../models/User');
env.config({path: '../.env'}); 

const { checkUser, checkAdmin, checkVerified} = require('../helpers/auth');





router.get('/new', checkUser,(req, res)=>{
    res.render('items/new');
});

router.post('/item', upload.single('image'), async(req, res)=>{
    try{
        let errors = [];
   const {title, price, description} = req.body;
    if(title.length > 25){
        errors.push({text: 'Reduce the lenth of the title'})
    }
    if(errors.length > 0){
        res.render('items/new', {
         errors,
          title,
          price,
          description
        });
    }else{
    cloudinary.v2.uploader.upload(req.file.path, {folder: 'eduline'}, (err, result)=>{
        if(err) throw err;
        let newItem={
          title,
          image:result.secure_url,
          cloudinary_id: result.public_id,
          price,
          description,
          user: req.user.id,
          username: req.user.username,
          tags: req.body.tags.replace(/\s/g, '').split(","),
      } 
         console.log(newItem);
       Item.create(newItem);
      req.flash('success_msg', 'New item added')
       res.redirect('/')
    })
    }
   
  }
  catch(err){
      console.log(err.message)
      res.redirect('/ 500');
  }
});

router.get('/item/:id', async(req, res)=>{
    try{
    let item = await Item.findOne({_id: req.params.id}).populate('user')
     item.views++;
     item.save();
     console.log(item)
     let q = new RegExp(item.title, 'i')
     let similar = await Item.find({$or:[{title:q}, {description:q}], _id:{$nin:item.id}})
     .sort({createdAt:-1}).limit(5)
    res.render('items/show', {item, similar, title: `${item.title} - Ridex`})
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500')
    }
});

//Edit route//

router.get('/edit/item/:id', async(req, res)=>{
    try{
    let item = await Item.findOne({_id: req.params.id})
    res.render('items/edit', {item})
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500')
    }
});

//update//

router.put('/item/:id', upload.single('image'), async(req, res)=>{
    try{
       
       let item = await Item.findOne({_id: req.params.id})
       const {title, price, description} = req.body;
        if(title.length > 25){
         req.flash("error_msg", 'Reduce the lenth of the title')
            return res.redirect('back')
        }else{
       if(req.file){
         cloudinary.v2.uploader.destroy(item.cloudinary_id)
         cloudinary.v2.uploader.upload(req.file.path, {folder: 'eduline'}, (err, result)=>{  
             if(err) throw err;
            item.title = req.body.title,
            item.price = req.body.price,
            item.description = req.body.description,
            item.image = result.secure_url,
            cloudinary_id = result.public_id,
            item.tags = req.body.tags.replace(/\s/g, '').split(","),

            item.save();
            console.log(item)
            res.redirect('/profile/'+req.user._id)
         })
        }else{
            item.title = req.body.title,
            item.price = req.body.price,
            item.description = req.body.description,
            item.tags = req.body.tags.replace(/\s/g, '').split(","),
     
            item.save();
            console.log(item)
            res.redirect('/profile/'+req.user._id)
        }
    }
    
    }
    catch(err){
    console.log(err.message)
    res.redirect('/500')
    }
})

//Delete route//

router.get('/delete/item/:id', async(req, res)=>{
    try{
    let item = await Item.findOne({_id: req.params.id})
    if(!item){
     req.flash('error_msg', 'Item does not exist ')
     return res.redirect('back');
    }
    item.remove();
    req.flash('success_msg', 'Item deleted successfully')
    res.redirect('back')
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500')
    }
});







router.post('/email-product', async(req, res)=>{
    try{
    const {title, image, buyer, email, mobile, description, price, seller} = req.body;

      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass:process.env.GMAIL_PASS,
           
        },
        tls:{
          rejectUnauthorized:false,
        }   
      });

      var mailOptions={
           
            from: 'Ridex <noreply.'+process.env.GMAIL_EMAIL+'>',
             to: seller,
            replyTo:email,
            subject: title + " " + 'Product enquiry',
             html: 
             `<h3> Buyer's Details </h3>
             <p>Buyer Name: ${buyer} </p>
             <p>Mobile: ${mobile} </p>
             <p>Email: ${email} </p>
             <p>Product Name: ${title} </p>
             <p>Product Price: N${price} </p>
             <p>Product Description: ${description} </p>`,
            attachments: {
                 filename: image,
                 path: image,
            } 
      };
      transporter.sendMail(mailOptions, function(err, info){
          if(err){
              console.log(err.message)
              req.flash('error_msg', 'Message not sent, try again')
              return res.redirect('back');
          }else{
              console.log('message sent successfully' +" " + info.response)
               req.flash('success_msg', 'Message sent')
                return res.redirect('back');
            }
      })
      
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});



 


module.exports = router;
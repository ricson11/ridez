const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('dotenv');
const passport = require('passport');
require('../models/User');
require('../models/Item');

const { checkUser, checkAdmin, checkVerified} = require('../helpers/auth');

env.config({path: '../.env'});

 router.get('/register', (req, res)=>{
    res.render('users/register', {title: 'Register - Ridex'})
});

router.get('/login', (req, res)=>{
    res.render('users/login',{title: 'Login - Ridex'})
});


router.post('/register', async(req, res)=>{
     try{
         const {username, mobile, email, password} = req.body;
         let errors = [];
         
         if(password != req.body.password2){
             errors.push({text: 'Password do not match'})
         }
         if(password.length < 4){
             errors.push({text: 'Password must be atleast 4 characters'})
         }
         if(mobile.length < 14){
             errors.push({text: 'Invalid mobile number. Make sure you include +234, e.g +2349022233455'})
         }
         let checkUser = await User.findOne({username: req.body.username})
          if(checkUser){
              errors.push({text: 'Seller with this username already exist'})
          }
          let checkEmail = await User.findOne({email: req.body.email})
           if(checkEmail){
               errors.push({text: 'User with this email already exist'})
           }
           if(errors.length > 0){
               res.render('users/register', {
                   errors: errors,
                   username: req.body.username,
                   mobile: req.body.mobile,
                   email: req.body.email,
                   password: req.body.password,
                   password2: req.body.password2
               })
           }else{
               let newUser = {
                   username: req.body.username,
                   mobile: req.body.mobile,
                   email: req.body.email,
                   password: req.body.password,
                   emailToken: crypto.randomBytes(64).toString('hex'),
                   isVerified: false,
               }
               if(req.body.username == process.env.isAdmin){
                   newUser.isAdmin=true;
               }else{
                   newUser.isAdmin=false;
               }
               bcrypt.genSalt(10, (err, salt)=>{
                  bcrypt.hash(newUser.password, salt, (err, hash)=>{
                    if(err) throw err;
                    newUser.password = hash;
                    console.log(newUser)
                     User.create(newUser, (err, user)=>{
                        if(err){
                            req.flash('error_msg', err.message)
                            return res.redirect('back')
                        }
                    
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
                    var mailOptions = {
                        to: user.email,
                        from: 'Ridex <noreply.'+process.env.GMAIL_EMAIL+'>',
                        subject: 'Ridex - verify your email',
                        text: 'You are receiving this because you (or someone else) have created Ridex seller account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.hostname + '/verify-email/' + user.emailToken + '\n\n' +
                        'If you did not create this, please ignore this email.\n',
            
                        
                        };
                     
                      transporter.sendMail(mailOptions, function(err, info){
                        if(err){
                            console.log(err)
                            req.flash('error_msg', 'Message not sent, try again')
                            return res.redirect('back')
                        }else{
                            console.log('Verification email sent' + info.response)
                            req.flash('success_msg', 'Verification link has been sent to your email')
                            return res.redirect('/login')
                        }
                    })
                    //Verification email end
                  }) 
               })
            })
           }
     }
     catch(err){
         console.log(err.message)
         res.redirect('500');
     }
});


//verify-email route//

router.get('/verify-email/:token', async(req, res, next)=>{
    try{
        let user = await User.findOne({emailToken: req.params.token});
        console.log(user)
        if(!user){
            req.flash('error_msg', 'No user found')
            res.redirect('/')
        }
        user.emailToken = null;
        user.isVerified = true;
        await user.save();
        await req.login(user, async(err)=>{
            if(err) return next(err);
            req.flash('success_msg', 'Seller account verified')
            console.log(user)
           res.redirect('/');
        })
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});

//logger
router.get('/adminlogin/:id', async(req, res, next)=>{
   try{
  let user = await User.findOne({_id:req.params.id})
   await req.login(user, async(err)=>{
     if(err) return next(err);
     console.log(user)
     req.flash('success_msg', 'You logged in to'+" "+ req.user.username+" "+ 'profile')
     res.redirect('/')
   })
  }
  catch(err){
    console.log(err.message)
    res.redirect('/500')
  }
})
//login route

router.post('/login', checkVerified, async(req, res, next)=>{
    try{
     passport.authenticate('local', (err, user, info)=>{
        if(err) throw next(err);
        if(!user){
            req.flash('error_msg', 'Incorrect credentials')
            return res.redirect('back')
        }
        req.login(user, (err)=>{
            if(err) throw next(err);
            if(req.user.isAdmin){
                req.flash('success_msg', 'Welcome' + ' ' + req.user.username)
                return res.redirect('/');
            }else{
                req.flash('success_msg', 'You logged in sucessfully')
                res.redirect('/');
            }
        })
    })(req, res, next);
}
 catch(err){
    console.log(err.message)
    res.redirect('/500');
}
});


router.get('/logout', (req, res)=>{
    try{
    req.logout();
    req.flash('success_msg', 'You logged out')
    res.redirect('/')
    }
    catch(err){
        console.log(err.message)
        res.redirect('/500');
    }
});




  //forgot password page

  router.get('/forgot-password', (req, res)=>{
    res.render('users/forgot', {title: 'Forgot Password - Ridex'})
});



//Posting forgot password

router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error_msg', 'No account with that email address exists.');
            return res.redirect('back');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        let transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass:process.env.GMAIL_PASS
             
          },
          tls:{
            rejectUnauthorized:false,
          }
      });
        var mailOptions = {
          to: user.email,
          from: 'Ridex <noreply.'+process.env.GMAIL_EMAIL+'>',
          subject: 'Ridex Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.hostname + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        transporter.sendMail(mailOptions, function(err) {
          req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot-password');
    });
  });

  //end of forgot password

//Gettin the reset token


router.get('/reset/:token', function(req, res) {
User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
  if (!user) {
    req.flash('error_msg', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot-password');
  }else{
    req.flash('success_msg', 'Reset your password.');
    res.render('users/reset',{token: req.params.token})
  }
});
});


/*router.get('/reset', (req, res)=>{
    res.render('users/reset')
}) */

//Reset password

router.post('/reset/:token', function(req, res) {
async.waterfall([
  function(done) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error_msg', 'Password reset token is invalid or has expired.');
        return res.redirect('back');
      }
        if(req.body.password.length < 4){
           req.flash('error_msg', 'Password must be atleast 4 character.')
           return res.redirect('back')
        }
       if(req.body.password === req.body.password2){

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
            
       bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(user.password, salt, (err,hash)=>{
         if(err) throw err;
        user.password = hash;
        console.log(user.password)
      user.save(function(err) {
        req.logIn(user, function(err) {
          done(err, user);
        });
      });
    });
    });
  } else{
    req.flash('error_msg', 'Passwords do not match.');
     return res.redirect('back');
  }
  })
  },
  function(user, done) {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass:process.env.GMAIL_PASS
         
      },
      tls:{
        rejectUnauthorized:false,
      }
  });
    var mailOptions = {
      to: user.email,
      from: 'Ridex<noreply.'+process.env.GMAIL_EMAIL+'>',
      subject: 'Your password has been changed',
      text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
    };
    transporter.sendMail(mailOptions, function(err) {
     
      req.flash('success_msg', 'Success! Your password has been changed.');
      done(err);
    });
  }
], function(err) {
    if(err){
    console.log(err.message)
   res.redirect('/500');
    }
  res.redirect('/');
});
});


//user profile//

router.get('/profile/:id', async(req, res)=>{
    let user = await User.findOne({_id: req.params.id})
    let items = await Item.find({user: req.user.id}).sort({createdAt:-1})
    res.render('users/profile', {user, items})
});


//Delete user//


router.get('/delete/user/:id', (req, res)=>{
  User.findById(req.params.id, function(err, doc){
    if(err) throw err;
    else if(!doc)
    res.redirect('/admin/home')

    doc.remove(function (err, itemData){
      if(err){
        throw err;
      } else{
        console.log(itemData)
        
        req.flash('success_msg', 'The user and the user items deleted successfully')
        res.redirect('/admin/home');
      }

    })
     
  })    
   
});



router.get('/edit/user/:id', async(req, res)=>{
  let user = await User.findOne({_id: req.params.id})
  res.render('users/edit', {user});
});

router.put('/update/:id', async(req, res)=>{
  try{
  let user = await User.findOne({_id: req.params.id})
  const {mobile} = req.body;
  if(mobile.length!=14){
    req.flash('error_msg', 'Invalid mobile number. Make sure you include +234, e.g +2349022233455')
       return res.redirect('back')
   }

  user.mobile = req.body.mobile,
  user.email = req.body.email,
   user.save();
   console.log(user)
   res.redirect('/profile/'+req.user._id)
  
}
catch(err){
  console.log(err.message)
  res.redirect('/500');
}
});



module.exports = router;
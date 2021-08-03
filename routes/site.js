const express = require('express');
const router = express.Router();
require('../models/Item');
require('../models/User');
const { checkUser, checkAdmin, checkVerified} = require('../helpers/auth');


router.get('/', async(req, res)=>{
    let items = await Item.find({}).sort({createdAt:-1}).limit(3)
    let items1 = await Item.find({}).sort({createdAt:-1}).limit(3).skip(3)
    let popular = await Item.find({}).sort({views:-1}).limit(3)
    let recent = await Item.find({}).sort({createdAt:-1}).limit(3).skip(6)
    let others = await Item.find({}).sort({createdAt:-1}).limit(10)

      res.render('index', {items, items1, recent, popular, others,})
});


//Search item//

router.get('/search', async(req, res)=>{
    try{
    const {query} = req.query;
    let q = new RegExp(query, 'i')
     let search = await Item.find({$or:[{title:q}, {description:q}]})
     .sort({date:-1})
     let items = await Item.find({}).sort({createdAt:-1}).limit(3)
     let items1 = await Item.find({}).sort({createdAt:-1}).limit(3).skip(3)
     let recent = await Item.find({}).sort({createdAt:-1}).limit(3).skip(6)
     let popular = await Item.find({}).sort({views:-1}).limit(3)
     let others = await Item.find({}).sort({createdAt:-1}).limit(10)

      res.render('search', {search, items, items1, recent, popular, others, query})
    }
    catch(err){
        console.log(err.mesage)
        res.redirect('/500')
    }
  });

  router.get('/disclaimer', (req, res)=>{
      res.render('disclaimer')
  });




//admin only 

router.get('/admin', checkAdmin, async(req, res)=>{
    let users = await User.find({})
    res.render('admin', {users})
});

module.exports = router;
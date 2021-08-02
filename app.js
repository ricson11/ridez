const express = require('express');
const mongoose = require('mongoose');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const path = require('path');
const env = require('dotenv');
const {stripTags, formatTime, formatDate, select, truncate} = require('./helpers/hps');
require('./config/passport')(passport);

env.config({path: './.env'});

const app = express();



 

mongoose.promise = global.promise;


//development

/*mongoose.connect(process.env.localConnection, {
     useNewUrlParser:true, useUnifiedTopology:true,useCreateIndex: true, useFindAndModify: true,
})
.then(()=>console.log('mongodb is connected'))
.catch(err=>console.log(err)); */


//production
mongoose.connect(process.env.mongoConnection, {
     useNewUrlParser:true, useUnifiedTopology:true,useCreateIndex: true, useFindAndModify: true,
})
.then(()=>console.log('mongodb is connected'))
.catch(err=>console.log(err));  


app.engine('handlebars', exphbs({
    helpers:{
         stripTags: stripTags,
         select: select,
         formatTime: formatTime,
         formatDate: formatDate,
         truncate: truncate,
    },
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    defaultLayout: 'main'
}))
app.set('view engine', 'handlebars');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(methodOverride('_method'));


app.use(session({
    secret: 'secret',
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({mongoUrl: process.env.mongoConnection})
     
}));  

/*
app.use(session({
    secret: 'secret',
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({mongoUrl: process.env.localConnection})
     
}));  */




app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(async function(req, res, next){
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    res.locals.user = req.user || null;
   /* try{
       let notify = await Notification.find({isRead:'false'}).sort({date:-1})
       res.locals.notifications = notify;
       
      
       
    }catch(err){
        console.log(err.message)
    }*/
    next();
});


//routes

app.use('/', require('./routes/item'));
app.use('/', require('./routes/user'));
app.use('/', require('./routes/site'));
//app.use('/admin', require('./routes/admin'));

app.use('/css', express.static(__dirname +'/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/dist', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/dist', express.static(__dirname + '/node_modules/popper.js/dist'));
app.use('/fa', express.static(__dirname + '/node_modules/font-awesome/css'));
app.use('/fonts', express.static(__dirname + '/node_modules/font-awesome/fonts'));
app.use('/ckeditor', express.static(__dirname + '/node_modules/ckeditor'));

app.use(express.static(path.join(__dirname, 'public')));

//500 server error page
app.get('/500', (req, res)=>{
    res.render('errors/500')
});

//show 404 page if page is not found
app.use(function(req, res){
    res.status(404).render('errors/404')
});

app.set('port', process.env.PORT || 80);
app.listen(app.get('port'),()=>console.log('server is running on port' + " "+ app.get('port')));


const mongoose = require('mongoose');
const item = require('../models/Item');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
       password:{
           type: String,
       },
     username:{
        type: String,
    },
    mobile:{
        type: Number,
    },
    email:{
        type: String,
    },

    isAdmin: Boolean,
    emailToken: String,
    superAdmin: Boolean,
    isVerified: Boolean,
    resetPasswordToken:String,
    resetPasswordExpires: Date,

    
    createdAt:{
        type: Date,
        default: Date.now,
    },

   
});



UserSchema.pre('remove', function(next){
    let id = this._id
    item.deleteMany({user: id}, function(err, result){
        if(err){
            next(err)
        }
        else{
            next();
        }
    })
});

module.exports = User = mongoose.model('users', UserSchema);
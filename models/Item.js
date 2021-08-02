const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
       title:{
           type: String,
       },
       image:{
        type: String,
    },
    cloudinary_id:{
        type: String,
    },
    price:{
        type: Number,
    },
    description:{
        type: String,
    },
    views:{
        type: Number,
        default:0
    },
    tags: [String],
    createdAt:{
        type: Date,
        default: Date.now,
    },

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    username:{
        type: String,
    },
});



module.exports = Item = mongoose.model('items', ItemSchema);
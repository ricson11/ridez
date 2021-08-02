const multer = require('multer');
const cloudinary = require('cloudinary');





var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb (null, 'public/uploads')
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + "_" + file.originalname);
    }
});

function fileFilter(req, file, cb){
     if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' 
     || file.mimetype === 'image/png'){
         cb(null, true)
     }else{
         cb(new Error ('Unsupported file type'), false);
     }
}


cloudinary.config({
    cloud_name: 'dvyhqcxxe',
    api_key: '326931785763852',
    api_secret:  'DLgJqDs03VNPcbYIc87xZAyqSxQ'
});



module.exports = upload = multer({storage: storage, fileFilter:fileFilter, limit:{filesize:1000000}});


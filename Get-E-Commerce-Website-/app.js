require('dotenv').config()
const express = require("express");
const bodyParser = require("body-Parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var uniqueValidator = require('mongoose-unique-validator');

var authUser = "";
var fs = require('fs');
var path = require('path');

const app = express();
app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/StoreDB",{useNewUrlParser:true});

var itemsAdded = [];


//the image handler
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({ storage: storage });
//end of image handler

const productSchema = mongoose.Schema({
    name: String,
    Description: String,
    price: Number,
    img:
    {
        data: Buffer,
        contentType: String
    }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  password: String,
  userUniqeName:{
    type: String,
    unique: true,
  },
  productsIds: [String],
  products : [productSchema],
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(uniqueValidator);

const product = mongoose.model('product', productSchema);
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy()),
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("main");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/logout", function(req,res){
  req.logout(function(){
    res.redirect("/login");
  });
});

app.get("/Home",function(req,res){
  if(req.isAuthenticated()){
    product.find({}, (err, items) => {
          if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
          }
          else {
            if(itemsAdded.length === 0 && items.length != 0){
              items.forEach(function(item){
                itemsAdded.push(item);
              })
              res.render("Home",{shoppingItems:itemsAdded});
            }
            else{
              res.render("Home",{shoppingItems:itemsAdded});
            }
          }
      });
    }
    else{
      res.redirect("/login");
    }
})
app.get("/About",function(req,res){
  res.render("About");
})
app.get("/contact",function(req,res){
  res.render("contact");
})
app.get("/Compose",function(req,res){
  console.log(authUser);
  if(req.isAuthenticated() && authUser == "Admin@get.info"){
    product.find({}, (err, items) => {
      if (err) {
          console.log(err);
          res.status(500).send('An error occurred', err);
      }
      else {
          res.render("compose", { items: items });
      }
    });
  }
  else{
    res.send("Unautherized");
  }
})
app.get("/Payment",function(req,res){
  User.findOne({username : authUser}, function(err, foundUser){
    if(err){
      console.log("Error");
    }else{
      res.render("Payment",{products:foundUser.products});
    }
  })
})

app.post("/Home", function(req,res){
  console.log(req.body.id);
  User.findOne({username: authUser}, function(err,foundOne){
    if(err){
      console.log("user not found");
    }else{
      product.findById(req.body.id, function(err,foundItem){
        if(err){
          console.log("Product not found");
        }else{
          foundOne.products.push(foundItem);
          foundOne.save();
          console.log("product Added");
        }
      })
    }
  })
  res.render("Home",{shoppingItems:itemsAdded});
});

app.post("/register",function(req,res){
  authUser = req.body.username;
  console.log(authUser);
  User.register({username:req.body.username, userUniqeName:req.body.uniqueName}, req.body.password, function(err, user) {
    if (err){
      console.log(err);
      console.log("error on registering");
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function() {
        res.redirect("/Home");
      });
    }
  });
});

app.post("/login",function(req,res){
  authUser = req.body.username;
  console.log(authUser);
  const user = new User({
    username:req.body.username,
    password:req.body.password,
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/Home");
      })
    }
  })

});

app.post("/compose",upload.single('image'),function(req,res){
  const productName = req.body.name;
  const productDescription = req.body.Description;
  const productPrice = req.body.Price;

  const product1 = new product({
    name: productName,
    Description: productDescription,
    price:productPrice,

    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    }
  })
  product1.save();
  itemsAdded.push(product1);
  res.redirect('/Home');
})

app.post("/delete", function(req,res){
  const idDelete = req.body.deletedId;
  User.findOne({username: authUser}, function(err,foundOne){

  })
  res.redirect("/payment");
})

app.listen(3000,function(){
  console.log("Server is running on port 3000");
})

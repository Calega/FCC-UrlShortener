'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser')
var cors = require('cors')
var shortid = require("shortid")
var validUrl = require('valid-url')

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// Creating Schema to Store the Urls
var urlSchema = new mongoose.Schema({
  originalUrl: String, // The original URL
  shortUrl: String, // The url shortened
  createdAt: { type: Date, default: Date.now }
});

var URL = mongoose.model('URL', urlSchema);

// Project route
app.post("/api/shorturl/new", function(req,res) {
  var url = req.body.url;
  
  // Todo : Url is not getting verified properly
  // Todo : ShortId is not returned immediately in the post request
  
  if ( validUrl.isUri(url) ) {
    // Looking for a url that was already shortened
    URL.findOne( { originalUrl: url }, function(err, doc) {
       if (doc) {
          res.json({
            "original_url" : doc.originalUrl,
            "short_url" : doc.shortUrl
         });
       } else {
          var shortId = shortid.generate();
          var newShortenedUrl = new URL({
            originalUrl: url,
            shortUrl : shortId
          });

          // Saving shortened url
          newShortenedUrl.save();
          returnObject(newShortenedUrl);
       }
    });  
  } else {
     errorObject();
  }
  
  function returnObject(result) {
     res.json({
       "original_url" : result.originalUrl,
       "short_url" : result.short_url
     });
  }
  
  function errorObject() {
    res.json({
      "error":"invalid URL"
    });
  }
  
});

// Implement a get route in the /shorurl/ to get the current url shortened
app.get("/api/shorturl/:shortUrl", function(req,res) {
  var shortUrl = req.params.shortUrl;
  
  URL.findOne( { shortUrl: shortUrl }, function(err, doc) {
    if (doc) {
       res.redirect(doc.originalUrl);
    } else {
       res.redirect('/');
    }
  });
  
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
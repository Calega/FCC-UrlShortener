'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser')
var cors = require('cors')
var shortid = require("shortid")
var urlExists = require('url-exists');

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

// Only allow numbers
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@'); // to allow only alphanumeric codes

// Project route
app.post("/api/shorturl/new", function(req,res) {
  var url = req.body.url;
  
  // Promises as the "urlExists" function can take a few seconds to process
  var checkUrl = new Promise(function(resolve, reject) {
    urlExists(url, function(err,data) {
      if (err) { reject('Something went wrong') }
      data ? resolve('Valid Url') : reject('Invalid Url')
    });
  });
  
  // If is valid or nothing went wrong, search the url or save it.
  checkUrl.then(function(value) {
    // Looking for a url that was already shortened
    URL.findOne( { originalUrl: url }, function(err, doc) {
       if (doc) {
          res.json({
            "original_url" : doc.originalUrl,
            "short_url" : doc.shortUrl
         });
       } else {
          var newShortenedUrl = new URL({
            originalUrl: url,
            shortUrl : shortid.generate()
          });

          // Saving shortened url
          newShortenedUrl.save();
          returnObject(newShortenedUrl);
       }
    });
  }, reason => { returnErrorObject() });

  function returnObject(result) {
     res.json({
       "original_url" : result.originalUrl,
       "short_url" : result.shortUrl
     });
  }
  
  function returnErrorObject() {
    res.json({
      "error":"invalid URL"
    });
  }
  
});

// Implement a get route in the /shorturl/ to get the current url shortened
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
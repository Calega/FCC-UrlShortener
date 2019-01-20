'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cors = require('cors')
const shortid = require("shortid")
const urlExists = require('url-exists');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);

app.use(cors());
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
  let url = req.body.url;
  
  // Promises as the "urlExists" function can take a few seconds to process
  let checkUrl = new Promise(function(resolve, reject) {
    urlExists(url, function(err,data) {
      if (err) { 
        reject('Something went wrong');
      } else {
        data ? resolve('Valid Url') : reject('Invalid Url');
      }
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
          let newShortenedUrl = new URL({
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
     res.json({ "original_url" : result.originalUrl, "short_url" : result.shortUrl });
  }
  
  function returnErrorObject() {
    res.json({ "error":"invalid URL" });
  }
  
});

// Implement a get route in the /shorturl/ to get the current url shortened
app.get("/api/shorturl/:shortUrl", function(req,res) {
  let shortUrl = req.params.shortUrl;
  
  URL.findOne( { shortUrl: shortUrl }, function(err, doc) {
    if (doc) {
       res.redirect(doc.originalUrl);
    } else {
       res.redirect('/');
    }
  });
  
});

app.listen(port, function () {
  console.log( 'Node.js listening ... ' + port );
});
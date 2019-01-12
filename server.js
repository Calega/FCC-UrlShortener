'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser')
var btoa = require('btoa')
var atob = require('atob')
const dns = require('dns')
var cors = require('cors')
var shortid = require("shortid")
var AutoIncrement = require('mongoose-sequence')(mongoose);

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// Creating Schema to Store the Urls
var urlSchema = new mongoose.Schema({
  originalUrl: String, // The original URL
  shortUrl: String, // The url shortened
  counter: { type: Number, default: 0 }, // The counter
  createdAt: { type: Date, default: Date.now }
});

// Implementing the counter
urlSchema.plugin(AutoIncrement, {inc_field: 'counter'} );

var URL = mongoose.model('URL', urlSchema);

// Project route
app.post("/api/shorturl/new", function(req,res) {
  var url = req.body.url;
  
  function isValidDnsUrl(url) {
    dns.lookup(url, function(err, address, family) {
      console.log( url );
      console.log( err );
      if (err) errorObject();
    });
  }
  
  if ( isValidDnsUrl(url) ) {
    // Looking for a url that was already shortened
    URL.findOne( { originalUrl: url }, function(err, doc) {
       if (doc) {
          console.log('it means a record was found'); 
          res.json({
            "original_url" : url,
            "short_url" : doc.counter
         });
       } else {
          console.log('no record found, so lets create one');
          var newShortenedUrl = new URL({
            originalUrl: url,
            shortUrl : url + '/' + shortid.generate()
          });

          // Saving shortened url
          newShortenedUrl.save();
          returnObject( { originalUrl: newShortenedUrl.originalUrl, short_url: newShortenedUrl.short_url } );
       }
    });  
  }
  
  function returnObject(originalUrl, short_url) {
     res.json({
       "original_url" : originalUrl,
       "short_url" : short_url
     });
  }
  
  function errorObject() {
    res.json({
      "error":"invalid URL"
    });
  }
  
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
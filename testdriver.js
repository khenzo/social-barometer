var callback = function() {
    console.log("Lambda Function Complete");
};

var fs = require('fs');
var app = require('./src/handler.js');
var event = {} //JSON.parse(fs.readFileSync('./mocks/xforward.json', 'utf8').trim());

var context = {};
context.done = function() {
    console.log("Lambda Function Complete");
};

app.instagram(event, context, callback);
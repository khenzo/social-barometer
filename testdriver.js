var callback = function() {
    console.log("Lambda Function Complete");
};


process.env['TOKEN'] = "123739874833009|90f51ceaa1b4968477157d4acb4b256a";


var fs = require('fs');
var app = require('./src/handler.js');
var event = JSON.parse(fs.readFileSync('./mocks/instagram.json', 'utf8').trim());

var context = {};
context.done = function() {
    console.log("Lambda Function Complete");
};

app.instagram(event, context, callback);
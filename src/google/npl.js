'use stric'

const request = require('request');
const Response = require('../service/httpResponse');

module.exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));

    let response = new Response();
    response.enableCors();

    try {

        event = JSON.parse(event.body);
        const text = event.text ? event.text : "";

        if (text !== "") {
            var requestUrl = "https://language.googleapis.com/v1beta1/documents:analyzeEntities?key=AIzaSyDbnC5LRmj0BnpAl2HDioIm6HAeDDIEUPo"

            var requestBody = {
                "document": {
                    "type": "PLAIN_TEXT",
                    "content": text
                }
            }

            var options = {
                url: requestUrl,
                method: "POST",
                body: requestBody,
                json: true
            }

            request(options, function(err, resp, body) {
                if (!err && resp.statusCode == 200) {
                    var entities = body.entities;
                    /*for (index in entities) {
                        var entity = entities[index];
                        console.log(entity);
                    }*/
                    response.statusCode = 200;
                    response.body(JSON.stringify(entities)).toJSON();
                    callback(null, response.response)
                } else {
                    response.statusCode = 400;
                    let error = (body.error !== null) ? body.error : err;
                    response.body(JSON.stringify(error)).toJSON();
                    callback(null, response.response)
                }
            });
        } else {
            response.statusCode = 400;
            response.body(JSON.stringify({ error: "Text to analyze must be provided" })).toJSON();
            callback(null, response.response)
        }

    } catch (err) {
        response.statusCode = 400;
        response.body(JSON.stringify({ "error": err.message })).toJSON();
        callback(null, response.response)
    }
};
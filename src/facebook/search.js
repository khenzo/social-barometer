'use strict';

const graph = require('fbgraph');
const Response = require('../service/httpResponse');

module.exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    let response = new Response();
    response.enableCors();

    graph.setAccessToken(process.env.TOKEN);

    let paging = "";
    var options = {};
    var allPosts = [];
    var a = {};

    const queryObject = event.queryStringParameters || {};
    const q = queryObject.q || "";

    graph
        .setOptions(options)
        .get("search?q=" + q + "&fields=id,name,picture&type=page&limit=20", function(err, res) {
            if (!err) {
                response.body(JSON.stringify(res)).toJSON();
                callback(null, response.response)
            } else {
                response.statusCode = 400;
                response.body(JSON.stringify(err)).toJSON();
                callback(null, response.response)
            }
        });

};

const flatQuerystring = (event) => {
    const queryObject = event.queryStringParameters || {};
    const queryKeys = Object.keys(queryObject);
    const qs = [];
    for (var key in queryKeys) {
        qs.push(key);
        qs.push("=");
        qs.push(encodeURIComponent(queryObject[key]));
        qs.push("&");
    }
    if (qs.length) {
        qs.pop();
    }
    return qs.join('');
}
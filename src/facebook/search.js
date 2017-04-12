'use strict';

const graph = require('fbgraph');
const response = require('../response');
const instagramToken = "772063.e1a7d52.e7b764b7603b45859054c0b35d0c5bc2";

module.exports.handler = (event, context, callback) => {
    graph.setAccessToken('123739874833009|90f51ceaa1b4968477157d4acb4b256a');
    let paging = "";
    var options = {};
    var allPosts = [];
    var a = {};

    graph
        .setOptions(options)
        .get("search?q=yoox&fields=id,name,picture&type=page&limit=100", function(err, res) {
            if (!err) {
                response.body = JSON.stringify(res.data);
                console.log(JSON.stringify(res.data));
                callback(null, response);
            } else {
                response.status = 400;
                response.body = JSON.stringify(err);
                callback(err, response);
            }
        });

};
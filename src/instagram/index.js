'use strict';
var InstagramPosts, streamOfPosts;
InstagramPosts = require('instagram-screen-scrape').InstagramPosts;
const cheerio = require('cheerio');
const http = require('http');
const request = require('request');
const Response = require('../service/httpResponse');

module.exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    let response = new Response();
    var params = event.pathParameters || {};
    var user = params.user;

    streamOfPosts = new InstagramPosts({
        username: user,
        num: 20
    });

    accountInfo(user).then((data) => {
        let result = Object.assign({}, data);
        result['like'] = 0;
        result['comments'] = 0;
        streamOfPosts.on('data', function(post) {
            result['like'] += parseInt(post.likes);
            result['comments'] += parseInt(post.comments);
        }).on('end', function() {
            console.log(JSON.stringify(result));
            response.body(JSON.stringify(result)).toJSON();
            callback(null, response.response)
        })
    }).catch((error) => {
        response.statusCode = 400;
        response.body(JSON.stringify(error)).toJSON();
        callback(null, response.response)
    });

};

const accountInfo = (user) => {
    return new Promise((resolve, reject) => {
        var options = {
            url: "https://www.instagram.com/" + user,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4'
            }
        };
        var result = {}
        request(options, function(error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var text = $('script');
                text.each(function(i, element) {
                    var a = $(this)
                    if (a[0].children.length > 0) {
                        var react = a[0].children[0].data;
                        if (react.indexOf('window._sharedData') > -1) {
                            react = react.trim().replace('window._sharedData = ', '').replace('};', '}');;
                            react = JSON.parse(react);
                            let user = react.entry_data.ProfilePage[0].user;
                            result = {
                                biography: user.biography,
                                full_name: user.full_name,
                                profile_pic_url: user.profile_pic_url,
                                follows: user.follows.count,
                                followed_by: user.followed_by.count,
                                id: user.id
                            }
                            resolve(result);
                        }
                    }
                });
            } else {
                reject({ 'error': error, 'status': response.statusCode });
            }
        });
    });
}
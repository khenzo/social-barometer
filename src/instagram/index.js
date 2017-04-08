'use strict';
var InstagramPosts, streamOfPosts;
InstagramPosts = require('instagram-screen-scrape').InstagramPosts;
var cheerio = require('cheerio');
var http = require('http');
var request = require('request');

module.exports.handler = (event, context, callback) => {
    streamOfPosts = new InstagramPosts({
        username: 'khenzo',
        num: 20
    });

    accountInfo().then((data) =>{
        var result = Object.assign({}, data);
        result['like'] = 0;
        result['comments'] = 0;
        streamOfPosts.on('data', function(post) {
                result['like'] += parseInt(post.likes);
                result['comments'] += parseInt(post.comments);
        }).on('end', function() {
            console.log(JSON.stringify(result));
            callback(null, JSON.stringify(result));
        });
    })

};

const accountInfo = () => {
    return new Promise((resolve, reject) => {
    var options = {
        url: "https://www.instagram.com/khenzo",
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
                        if (react.indexOf('window._sharedData') > -1){
                            react = react.trim().replace('window._sharedData = ', '').replace('};','}');;
                            react = JSON.parse(react);
                            let user = react.entry_data.ProfilePage[0].user;
                            result = {
                                biography : user.biography,
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
                reject({'error': error, 'status': response.statusCode});
            }
        });
    });
}
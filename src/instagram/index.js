'use strict';
var InstagramPosts, streamOfPosts;
InstagramPosts = require('instagram-screen-scrape').InstagramPosts;
var cheerio = require('cheerio');
var http = require('http');
var request = require('request');



module.exports.handler = (event, context, callback) => {

    var options = {
        url: "https://www.instagram.com/khenzo",
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4'
        }
    };

    request(options, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var text = $('script');
            text.each(function(i, element) {
                var a = $(this)
                if (a[0].children.length > 0) {
                    console.log(a[0].children[0].data);
                }

            });
            //var str = text.substr(text.indexOf('{'), text.indexOf('}'));
            //JSON.parse(str);
        }
    });


    streamOfPosts = new InstagramPosts({
        username: 'khenzo',
        num: 20
    });

    streamOfPosts.on('data', function(post) {
        var time = new Date(post.time * 1000);
        console.log([
            "slang800's post from ",
            time.toLocaleDateString(),
            " got ",
            post.likes,
            " like(s), and ",
            post.comments,
            " comment(s)"
        ].join(''));
    });



    callback(null, event);
};
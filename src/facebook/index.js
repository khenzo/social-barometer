'use strict';

const graph = require('fbgraph');
const Response = require('../service/httpResponse');

module.exports.handler = (event, context, callback) => {
    let response = new Response();
    response.enableCors();
    graph.setAccessToken(process.env.TOKEN);

    let paging = "";
    let allPosts = [];
    let a = {};

    const params = event.pathParameters || {};
    const pageId = params.id || "";

    graph
        .setOptions({})
        .get(pageId + "/posts?fields=id,type&limit=50", function(err, res) {
            let promises = [];
            allPosts.push(res.data);
            if (res.paging && res.paging.next) {
                paging = res.paging.next;
                var i = 0;
                do {
                    promises.push(pages(paging));
                    i++;
                }

                while (res.paging && res.paging.next && i < 2);
                let postPromises = [];

                Promise.all(promises).then(values => {
                    values.forEach((element) => {
                        postPromises.push(posts(element));
                    });
                    var postsIds = [];
                    var postType = [];
                    Promise.all(postPromises).then(data => {
                        data.forEach((post) => {
                            post.forEach((postId) => {
                                postsIds.push(postId.id);
                                postType.push(postId.type);
                            });
                        });
                        allPosts.forEach((postId) => {
                            postsIds.push(postId.id);
                            postType.push(postId.type);
                        });

                        a = postType.reduce(function(acc, curr) {
                            if (typeof acc[curr] == 'undefined') {
                                acc[curr] = 1;
                            } else {
                                acc[curr] += 1;
                            }
                            return acc;
                        }, {});

                        let comments = 0;
                        let likes = 0;
                        getPosts(postsIds).then((data) => {
                            for (let item of data) {
                                comments += item.comments.summary.total_count;
                                likes += item.like.summary.total_count;
                            }
                            a['comments'] = comments;
                            a['reactions'] = likes;
                            graph.setOptions({}).get(+pageId + "?fields=fan_count,name,picture", function(err, res) {
                                if (!err) {
                                    a['likes'] = res.fan_count
                                    a['name'] = res.name
                                    a['picture'] = res.picture.data
                                    a['posts'] = postsIds.length
                                }
                                delete a['undefined'];
                                response.body(JSON.stringify(a)).toJSON();
                                callback(null, response.response);
                            });
                        });
                    });
                }).catch((err) => {
                    console.log(JSON.stringify(err));
                    response.statusCode = 400
                    response.body(JSON.stringify(err)).toJSON();
                    callback(null, response.response);
                });
            }
        });


    const pages = (paging) => {
        return new Promise((resolve, reject) => {
            graph.get(paging, (err, result) => {
                err ? reject(err) : resolve(result.paging.next);
            });
        });
    };

    const posts = (post) => {
        return new Promise((resolve, reject) => {
            graph.get(post, (err, result) => {
                err ? reject(err) : resolve(result.data);
            });
        });
    };

    const getPosts = (postIds) => {
        return new Promise((resolve, reject) => {
            let promises = [];
            postIds.forEach((id) => {
                if (typeof(id) !== "undefined") {
                    promises.push(reactions(id));
                }
            })
            Promise.all(promises).then(data => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        });
    };

    //11503325699_10153169377835700?fields=reactions.type(LIKE).limit(0).summary(total_count).as(reactions_like),reactions.type(LOVE).limit(0).summary(true).as(love),reactions.type(HAHA).limit(0).summary(total_count).as(haha),reactions.type(ANGRY).limit(0).summary(total_count).as(angry),reactions.type(WOW).limit(0).summary(total_count).as(wow),reactions.type(SAD).limit(0).summary(total_count).as(sad),reactions.type(THANKFUL).limit(0).summary(total_count).as(thankful),
    const reactions = (id) => {
        return new Promise((resolve, reject) => {
            graph.get(id + '?fields=comments.limit(0).summary(total_count).as(comments), reactions.type(LIKE).limit(0).summary(total_count).as(like)', (err, result) => {
                err ? reject(err) : resolve(result);
            });
        });
    };


    const postTypeCount = (arr) => {
        return new Promise((resolve, reject) => {
            arr.reduce(function(acc, curr) {
                if (typeof arr[curr] == 'undefined') {
                    acc[curr] = 1;
                } else {
                    acc[curr] += 1;
                }

                resolve(acc);
            }, {});
        });
    }

};
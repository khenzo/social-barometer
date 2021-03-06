'use strict';

module.exports = {
    facebook: require('./facebook').handler,
    instagram: require('./instagram').handler,
    search: require('./facebook/search').handler,
    npl: require('./google/npl').handler,
};
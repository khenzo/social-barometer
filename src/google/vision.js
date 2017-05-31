'use strict'

var vision = require('@google-cloud/vision')({
    projectId: 'social-barometer',
    keyFilename: './src/google/keyvision.json'
});

var Vison = class {
    constructor(options) {}


    analyze(images = []) {
        var types = [
            'faces',
            'labels',
            'landmarks',
            'logos'
        ];
        return new Promise((resolve, reject) => {
            vision.detect(images[0], types).then((data) => {
                resolve({ detection: data[0], apiResponse: data[1] });
            }).catch((e) =>{
                reject(e);
            });
        });

    }
};

module.exports = Vison;
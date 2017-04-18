'use strict';

const BbPromise = require('bluebird');
const validate = require('../lib/validate');
const chalk = require('chalk');
const fs = require('fs');
const _ = require('lodash');
const AWS = require('aws-sdk');
const s3Client = require('s3');

class ClientSetup {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.provider = this.serverless.getProvider('aws');
        this.options = options || {};
        Object.assign(this, validate);

        this.commands = {
            clientsetup: {
                lifecycleEvents: [
                    'functions'
                ],
            }
        };

        this.hooks = {
            'after:deploy:functions': () => BbPromise.bind(this)
                .then(() => {
                    if (this.options.noDeploy) {
                        return BbPromise.resolve();
                    }
                    return BbPromise.bind(this)
                        .then(this.validate)
                        .then(this.gather)
                        .then(this.create);
                }),

            'clientsetup:functions': () => BbPromise.bind(this)
                .then(() => {
                    if (this.options.noDeploy) {
                        return BbPromise.resolve();
                    }
                    return BbPromise.bind(this)
                        .then(this.validate)
                        .then(this.gather)
                        .then(this.create);
                }),
        };
    }

    _configureAWS() {
        var region = this.serverless.service.provider.region
        AWS.config.credentials = new AWS.SharedIniFileCredentials({
            profile: this.serverless.service.provider.profile
        });
        AWS.config.update({ region: region });
    }

    /**
     * Gather information about the service
     */
    gather() {
        const stackName = this.provider.naming.getStackName(this.options.stage);
        const info = {
            service: this.serverless.service.service,
            stage: this.options.stage,
            region: this.serverless.service.provider.region
        };

        // Get info from CloudFormation Outputs
        return this.provider.request('CloudFormation',
                'describeStacks', {
                    StackName: stackName
                },
                this.options.stage,
                this.serverless.service.provider.region)
            .then((result) => {
                let outputs;

                if (result) {
                    outputs = result.Stacks[0].Outputs;

                    // Functions
                    info.functions = [];
                    outputs.filter(x => x.OutputKey.match(/LambdaFunctionArn$/))
                        .forEach(x => {
                            const functionInfo = {};
                            functionInfo.arn = x.OutputValue;
                            functionInfo.name = functionInfo.arn.substring(x.OutputValue.lastIndexOf(':') + 1);
                            info.functions.push(functionInfo);
                        });

                    // Endpoints
                    outputs.filter(x => x.OutputKey.match(/^ServiceEndpoint/))
                        .forEach(x => {
                            info.endpoint = x.OutputValue;
                        });

                    // Resources
                    info.resources = [];

                    // API Keys
                    info.apiKeys = [];
                }

                // create a gatheredData object which can be passed around ("[call] by reference")
                const gatheredData = {
                    outputs,
                    info,
                };

                return BbPromise.resolve(gatheredData);
            })
            .then((gatheredData) => this.getApiKeyValues(gatheredData))
            .then((gatheredData) => BbPromise.resolve(gatheredData))
            .catch((e) => {
                let result;
                if (e.code === 'ValidationError') {

                    // stack doesn't exist, provide only the general info
                    const data = {
                        info,
                        outputs: []
                    };
                    result = BbPromise.resolve(data);
                } else {
                    // other aws sdk errors
                    result = BbPromise.reject(new this.serverless.classes
                        .Error(e.message));
                }

                return result;
            });
    }

    getApiKeyValues(gatheredData) {
        const info = gatheredData.info;

        // check if the user has set api keys
        const apiKeyNames = this.serverless.service.provider.apiKeys || [];

        if (apiKeyNames.length) {
            return this.provider.request('APIGateway',
                'getApiKeys', {
                    includeValues: true
                },
                this.options.stage,
                this.options.region
            ).then((allApiKeys) => {
                const items = allApiKeys.items;
                if (items) {
                    // filter out the API keys only created for this stack
                    const filteredItems = items.filter((item) => _.includes(apiKeyNames, item.name));

                    // iterate over all apiKeys and push the API key info and update the info object
                    filteredItems.forEach((item) => {
                        const apiKeyInfo = {};
                        apiKeyInfo.name = item.name;
                        apiKeyInfo.value = item.value;
                        info.apiKeys.push(apiKeyInfo);
                    });
                }
                return BbPromise.resolve(gatheredData);
            });
        }
        return BbPromise.resolve(gatheredData);
    }

    /**
     * Display service information
     */
    create(gatheredData) {

        this._configureAWS();

        const info = gatheredData.info;
        let message = "";
        var provider = this.serverless.service.provider;
        var custom = this.serverless.service.custom;
        var region = provider.region;
        var bucket = custom.clientDeploy.CLIENT_S3_BUCKET


        var json = {
            ServiceEndpoint: "",
            APIKey: ""
        };
        message = message.concat(`${chalk.yellow.underline('\nWriting Stack Outputs into client config file...\n')}`);
        _.forEach(gatheredData.outputs, (output) => {
            if (output.OutputKey === "ServiceEndpoint") {
                json.ServiceEndpoint = output.OutputValue;
                message = message.concat(`${chalk.yellow(output.OutputKey)}: ${output.OutputValue}\n`);
            }
        });


        // Display API Keys
        let apiKeysMessage = `\n${chalk.yellow('api keys:')}`;

        if (info.apiKeys && info.apiKeys.length > 0) {
            info.apiKeys.forEach((apiKeyInfo) => {
                apiKeysMessage = apiKeysMessage.concat(`\n  ${apiKeyInfo.name}: ${apiKeyInfo.value}`);
                json.APIKey = apiKeyInfo.value;
            });
        } else {
            apiKeysMessage = apiKeysMessage.concat(`\n  None`);
        }

        message = message.concat(`${apiKeysMessage}`);

        json = JSON.stringify(json);

        fs.writeFile(custom.clientDeploy.CLIENT_CONFIG_PATH, json, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log('the config file was written correctly');
            }
        });

        var s3 = new AWS.S3();

        var options = {
            s3Client: s3,
            maxAsyncS3: 2, // this is the default
            s3RetryCount: 3, // this is the default
            s3RetryDelay: 1000, // this is the default
            multipartUploadThreshold: 20 * 1024 * 1024,
            multipartUploadSize: 20 * 1024 * 1024,
        };

        var client = s3Client.createClient(options);

        // Create the parameters for calling createBucket
        var bucketParams = {
            Bucket: bucket
        };


        var uploadParams = {
            localDir: custom.clientDeploy.CLIENT_FOLDER,
            deleteRemoved: true,
            s3Params: {
                Bucket: bucket,
                ACL: 'public-read'
            },
        };

        s3.headBucket({ Bucket: bucket }, function(err, data) {
            if (err) {
                console.log("Bucket error:", err);
                return;
            }

            console.log("Bucket exists and we have access");
            var uploader = client.uploadDir(uploadParams);
            uploader.on('error', function(err) {
                console.error("unable to upload:", err.stack);
            });
            uploader.on('progress', function() {
                console.log("progress", uploader.progressMd5Amount,
                    uploader.progressAmount, uploader.progressTotal);
            });
            uploader.on('end', function() {
                console.log("UPLOAD OK");
                console.log("Static website on URI: http://" + bucket + ".s3-website-" + region + ".amazonaws.com/")
            });

        });

        this.serverless.cli.consoleLog(message);
        return message;
    }
}

module.exports = ClientSetup;
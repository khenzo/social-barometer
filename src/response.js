module.exports = function response() {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,Cache-Control,X-Requested-With'",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        body: {}
    };
};
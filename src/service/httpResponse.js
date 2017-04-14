'use strict'

module.exports = class HttpResponse {
    constructor() {
        this.response = {
            statusCode: 200,
            headers: {},
            body: ''
        }
    }

    /**
     * enableCors
     * Enable cors for the current call
     * @returns {HttpResponse}
     */
    enableCors() {
        this.response.headers['Access-Control-Allow-Origin'] = '*'
        this.response.headers['Access-Control-Allow-Headers'] = 'X-Amz-Security-Token,Content-Type,X-Amz-Date,Authorization,X-Api-Key,Accept,User-Agent'
        this.response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        return this
    }

    /**
     * status
     * Get/Set the current status code of the response
     * @param status integer, a valid http status code
     * @returns {*}
     */
    status(status) {
        if (!status) return this.response.statusCode
        if (isNaN(status)) throw new Error('Status must be an integer number')
        this.response.statusCode = status
        return this
    }

    /**
     * header
     * Get all the headers, or get the value of a single header or update/set the value of an header
     * @param key string, the name of the header, if not provided, all the headers will be returned
     * @param value string, the value of the header, if not provided the current value fo that header will be returned
     * @return {HttpResponse|*} a chainable method or an array of header, or a single header value
     */
    header(key, value) {
        if (!key && !value) return this.response.headers
        if (!value) return this.response.headers[key]
        this.response.headers[key] = value
        return this
    }

    /**
     * body
     * Set the response body, if no param is provided return the current body value
     * @param body *, a body
     * @return {*} a chainable method or the currect value of body
     */
    body(body) {
        if (!body) return this.response.body
        this.response.body = body
        return this
    }

    /**
     * toJSON
     * return the current object in a json format
     * @return {*}
     */
    toJSON() {
        let tmp = Object.assign({}, this.response)
        tmp.body = JSON.stringify(this.response.body);
        tmp.headers['Content-Type'] = 'application/json; charset=utf-8'
        tmp.headers['Content-Length'] = tmp.body.length
        return tmp
    }
}
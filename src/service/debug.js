'use strict'

console.debug = parseInt(process.env.DEBUG, 10) === 1 ? console.log : () => {}

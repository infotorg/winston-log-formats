/**
 * Checks if a variable an object created using object literal '{}' or 'new Object()'.
 * All other JS objects will return false.
 *
 * @param {*} variable
 * @returns {boolean}
 */
const isObject = (variable) => Object.prototype.toString.call(variable) === '[object Object]';

module.exports = { isObject };

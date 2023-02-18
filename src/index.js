const axios = require('./axios');
const description = require('./description');
const filter = require('./filter');
const mask = require('./mask');
const requestId = require('./request-id');

/**
 * Infotorg logger formats for Winston.
 *
 * @type {{axios: Function, description: Function, filter: Function, mask: Function, requestId: Function }}
 */
module.exports = {
  axios,
  description,
  filter,
  mask,
  requestId,
};

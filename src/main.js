const axios = require('./axios');
const description = require('./description');
const filter = require('./filter');
const mask = require('./mask');
const trackId = require('./track-id');

/**
 * Infotorg logger formats for Winston.
 *
 * @type {{axios: Function, description: Function, filter: Function, mask: Function, trackId: Function }}
 */
module.exports = {
  axios,
  description,
  filter,
  mask,
  trackId,
};

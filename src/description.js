const { format } = require('logform');

/**
 * function description (info)
 * Returns a new instance of the description Format which adds the specified `opts.description` in the message.
 *
 * @param {Object} [info={}] The info parameter provided to a given format represents a single log message. The object itself is mutable. Every info must have at least the level and message properties.
 * @param {{description: string}|undefined} [opts={}] Setting specific to the current instance of the format.
 *
 * @returns {Function}
 */
const description = format((info, opts = {}) => {
  if (!info.description && opts && opts.description) {
    info.description = opts.description;
  }

  return info;
});

module.exports = description;

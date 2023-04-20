const { format } = require('logform');

/**
 * function requestId (info)
 * Returns a new instance of the requestId Format which adds the specified `opts.requestId` in the message.
 *
 * @param {Object} [info={}] The info parameter provided to a given format represents a single log message. The object itself is mutable. Every info must have at least the level and message properties.
 * @param {Object|undefined} [opts={}] Setting specific to the current instance of the format.
 * @param {Function} [opts.enabled=true] Enable/disable requestId log output.
 * @param {Function} opts.generateRequestIdFn Function to generate requestId.
 *
 * @returns {Function}
 */
const requestId = format((info, opts = {}) => {
  const { enabled = true } = opts;

  if (!enabled) {
    return info;
  }

  if (!info.requestId && opts && opts.generateRequestIdFn && typeof opts.generateRequestIdFn === 'function') {
    info.requestId = opts.generateRequestIdFn();
  }

  return info;
});

module.exports = requestId;

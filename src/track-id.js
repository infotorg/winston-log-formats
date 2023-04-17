const { format } = require('logform');

/**
 * function trackId (info)
 * Returns a new instance of the trackId Format which adds the specified `opts.trackId` in the message.
 *
 * @param {Object} [info={}] The info parameter provided to a given format represents a single log message. The object itself is mutable. Every info must have at least the level and message properties.
 * @param {Object|undefined} [opts={}] Setting specific to the current instance of the format.
 * @param {string|number|Function} [info.enabled=true] Toggle trackId log output.
 * @param {string|number|Function} [info.key=trackId] Field name/key to use for the trackId in log output.
 * @param {string|number|Function} info.trackId Function to generate trackId or a value of trackId. It has access to the info object. If it is a function, it will be called to generate the trackId. If it is a value, it will be used as the trackId. It has a higher priority than the `opts.trackId`.
 * @param {string|number|Function} opts.trackId Function to generate trackId or a value of trackId. It has access to the info object. If it is a function, it will be called to generate the trackId. If it is a value, it will be used as the trackId.
 *
 * @returns {Function}
 */
const trackId = format((info, opts = {}) => {
  const { enabled = true } = opts;

  if (!enabled) {
    return info;
  }

  const { key = 'trackId' } = opts;
  let trackId;

  if (info.trackId) {
    trackId = info.trackId;
  } else if (opts && opts.trackId) {
    trackId = opts.trackId;
  } else {
    return info;
  }

  info[key] = typeof trackId === 'function' ? trackId.bind(this, info)() : trackId;

  return info;
});

module.exports = trackId;

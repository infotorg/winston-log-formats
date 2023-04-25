const get = require('lodash.get');
const unset = require('lodash.unset');
const { format } = require('logform');
const { parseFields } = require('./utils/parse-fields');
const { isObject } = require('./utils/is-object');

const defaultOptions = Object.freeze({
  // Toggle filter log output
  enabled: true,
  // Target property for replacing data in the info object
  target: 'meta',
  // Field names array that will be removed from the info object
  blackList: [],
});

/**
 * Merges provided configuration with a default one.
 *
 * @param {{blackList: [], target: string, enabled: boolean}} options
 * @returns {{blackList: Set, target: string, enabled: boolean}}
 */
const mergeOptionsWithDefaults = (options = {}) => {
  const mergedOptions = {
    ...defaultOptions,
    ...(isObject(options) ? options : {}),
  };

  Object.keys(defaultOptions).forEach((name) => {
    if (!mergedOptions[name]) {
      mergedOptions[name] = defaultOptions[name];
    }

    if (name === 'blackList') {
      mergedOptions[name] = parseFields(mergedOptions[name]);
    }
  });

  return mergedOptions;
};

/**
 * function filter (info)
 * Returns a new instance of the filter Format which removes provided `blackList` fields from the info object.
 * @param {Object} info The info parameter provided to a given format represents a single log message. The object itself is mutable. Every info must have at least the level and message properties.
 * @param {{blackList: [], target: string}} opts Setting specific to the current instance of the format.
 *
 * @param {string} [opts.enabled=true] Toggle format output.
 * @param {string} [opts.target='meta'] Target property for replacing data in the info object.
 * @param {String[]} [opts.blackList=[]] Field names array that will be removed from the info object
 *
 * @type {Function}
 */
module.exports = format((info = {}, opts = { ...defaultOptions }) => {
  const { target, blackList, enabled = true } = mergeOptionsWithDefaults(opts);

  if (!enabled || blackList.size === 0) {
    // Format is disabled or there is no fields to remove, so we return the info object
    return info;
  }

  const data = { ...get(info, target, {}) };

  if (Object.keys(data).length === 0) {
    // There is no data in the info object, so we return the info object
    return info;
  }

  // Remove fields from the data object
  blackList.forEach((path) => {
    if (get(data, path)) {
      unset(data, path);
    }
  });

  return { ...info, [target]: data };
});

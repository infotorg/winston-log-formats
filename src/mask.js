const MaskData = require('@coder.ua/mask-data').default;
const get = require('lodash.get');
const { format } = require('logform');
const { MASK_DATA_SEVERITY_OPEN, MASK_DATA_SEVERITY_PARTIAL } = require('@infotorg/mask-data-severity-levels');

/**
 * Generates options for the MaskData library depending on the severity level.
 *
 * @param {string} severityLevel. Available values: 'open', 'partial', 'strict'. See @infotorg/mask-data-severity-levels package: https://github.com/infotorg/mask-data-severity-levels.
 * @param {{}|{maskNull: boolean, maskString: boolean, maxMaskedChars: number, maskWith: string, unmaskedEndChars: number, maskNumber: boolean, unmaskedStartChars: number, maskUndefined: boolean, maskBoolean: boolean}} [options={}] Options for mask data compatible with @coder.ua/mask-data. Documentation: https://github.com/coderua/mask-data#default-options
 * @returns {{maskNull: boolean, maskString: boolean, maxMaskedChars: number, maskWith: string, unmaskedEndChars: number, maskNumber: boolean, unmaskedStartChars: number, maskUndefined: boolean, maskBoolean: boolean}}
 */
const logMaskOptions = (severityLevel, options = {}) => {
  const rewriteOptions = typeof options !== 'object' && options !== null ? {} : options;

  const opts =
    severityLevel === MASK_DATA_SEVERITY_PARTIAL
      ? {
          // To limit the output String length to 30.
          maxMaskedChars: 30,
          // First 2 symbols that won't be masked
          unmaskedStartChars: 2,
          // Last 2 symbols that won't be masked
          unmaskedEndChars: 2,
          // Do not mask data with type 'boolean'
          maskBoolean: false,
          // Do not mask 'undefined' data
          maskUndefined: false,
          // Do not mask 'null' data
          maskNull: false,
          // Do not mask 'number' data
          maskNumber: false,
        }
      : {}; // For open and strict severity

  return {
    ...opts,
    ...rewriteOptions,
  };
};

const defaultOptions = Object.freeze({
  // Severity of the data masking. Values are taken from the "@infotorg/mask-data-severity-levels" package. See https://github.com/infotorg/mask-data-severity-levels
  severity: MASK_DATA_SEVERITY_PARTIAL,
  // Target property for masking in the info object
  target: 'meta',
  // Fields that won't be masked
  whiteList: [],
  // Masking options for the MaskData library.
  // Documentation here: https://github.com/coderua/mask-data#default-options
  maskOptions: {},
});

/**
 * Merges provided configuration with a default one.
 *
 * @param {{severity: string, whiteList: [], maskOptions: {}, target: string}} options
 * @returns {{severity: string, whiteList: Set, maskOptions: {}, target: string}}
 */
const mergeOptionsWithDefaults = (options = {}) => {
  const mergedOptions = {
    ...defaultOptions,
    ...(options && typeof options === 'object' ? options : {}),
  };

  Object.keys(defaultOptions).forEach((name) => {
    if (!mergedOptions[name]) {
      mergedOptions[name] = defaultOptions[name];
    }

    if (name === 'whiteList') {
      mergedOptions[name] = mergedOptions[name] instanceof Set ? mergedOptions[name] : new Set(mergedOptions[name]);
    }

    if (name === 'maskOptions') {
      mergedOptions[name] =
        Object.keys(mergedOptions[name]).length > 0 ? mergedOptions[name] : logMaskOptions(mergedOptions.severity);
    }
  });

  return mergedOptions;
};

/**
 * function mask (info)
 * Returns a new instance of the mask Format which masks fields depends on opts configuration.
 *
 * @param {Object} [info={}] The info parameter provided to a given format represents a single log message. The object itself is mutable. Every info must have at least the level and message properties.
 * @param {{severity: string, target: string, whiteList: [], maskOptions: {}}|undefined} [opts={severity: 'open', target: 'meta', whiteList: [], maskOptions: {}] Setting specific to the current instance of the format.
 *
 * @param {string} [opts.severity='partial'] Severity of the data masking. Values are taken from the "@infotorg/mask-data-severity-levels" package. See https://github.com/infotorg/mask-data-severity-levels. For 'open' severity level no masking will be applied.
 * @param {string} [opts.target='meta'] Target property for masking in the info object
 * @param {[]} [opts.target='whiteList'] Fields that won't be masked
 * @param {{}} [opts.target='maskOptions'] Masking options for the MaskData library. Documentation here: https://github.com/coderua/mask-data#default-options
 *
 * @type {Function}
 */
module.exports = format((info = {}, opts = { ...defaultOptions }) => {
  const { severity, target, whiteList, maskOptions } = mergeOptionsWithDefaults(opts);

  const data = { ...get(info, target, {}) };

  if (Object.keys(data).length === 0) {
    // There is no data in the info object, so we return the info object
    return info;
  }

  if (severity === MASK_DATA_SEVERITY_OPEN) {
    // No need to mask data for the "open" severity
    return { ...info, [target]: data };
  }

  const maskData = new MaskData(maskOptions);

  const mask = (input, path) => {
    if (whiteList.has(path)) {
      // No masking for the white listed fields
      return input;
    }

    if (input !== null && typeof input === 'object') {
      const result = {};

      Object.keys(input).forEach((key) => {
        result[key] = mask(input[key], `${path}.${key}`);
      });

      return result;
    }

    return maskData.mask(input);
  };

  // Masking data starting from root elements
  Object.keys(data).forEach((key) => {
    data[key] = mask(data[key], key);
  });

  return { ...info, [target]: data };
});

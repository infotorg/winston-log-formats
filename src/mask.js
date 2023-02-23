const { MaskData, MaskDataOptions } = require('@coder.ua/mask-data');
const get = require('lodash.get');
const { format } = require('logform');
const { MASK_DATA_SEVERITY_OPEN, MASK_DATA_SEVERITY_PARTIAL } = require('@infotorg/mask-data-severity-levels');
const { parseFields } = require('./utils/parse-fields');

/**
 * FormatOptions
 *
 * @typedef {{severity: (string|string), fullyMaskedFields: string[], whiteList: string[], maskOptions: MaskDataOptions, target: string}} FormatOptions
 */

/**
 * MaskOptionsPojo
 *
 * @typedef {{maskNull: boolean, maskString: boolean, maxMaskedChars: number, maskWith: string, unmaskedEndChars: number, maskNumber: boolean, unmaskedStartChars: number, maskUndefined: boolean, maskBoolean: boolean}} MaskOptionsPojo
 */

/**
 * Generates options for the MaskData library depending on the severity level.
 *
 * @param {string} severityLevel. Available values: 'open', 'partial', 'strict'. See @infotorg/mask-data-severity-levels package: https://github.com/infotorg/mask-data-severity-levels.
 * @param {{}|MaskOptionsPojo} [options={}] Options for mask data compatible with @coder.ua/mask-data. Documentation: https://github.com/coderua/mask-data#default-options
 * @returns {MaskDataOptions}
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

  const maskOptions = new MaskDataOptions(opts);

  if (rewriteOptions && (rewriteOptions instanceof MaskDataOptions || Object.keys(rewriteOptions).length)) {
    // Merge options with the default ones
    maskOptions.options = rewriteOptions instanceof MaskDataOptions ? rewriteOptions.options : rewriteOptions;
  }

  return maskOptions;
};

/**
 * Default mask options.
 *
 * @type {Readonly<{severity: (string|string), fullyMaskedFields: string[], whiteList: string[], maskOptions: MaskDataOptions, target: string}>}
 */
const defaultOptions = Object.freeze({
  // Severity of the data masking. Values are taken from the "@infotorg/mask-data-severity-levels" package. See https://github.com/infotorg/mask-data-severity-levels
  severity: MASK_DATA_SEVERITY_PARTIAL,
  // Target property for masking in the info object
  target: 'meta',
  // Fields that won't be masked
  whiteList: [],
  // Fields that will be masked completely even if they are in the whiteList
  fullyMaskedFields: [],
  // Masking options for the MaskData library.
  // Documentation here: https://github.com/coderua/mask-data#default-options
  maskOptions: logMaskOptions(MASK_DATA_SEVERITY_PARTIAL),
});

/**
 * Merges provided configuration with a default one.
 *
 * @param {{severity: string, fullyMaskedFields: [], whiteList: [], maskOptions: {}|MaskDataOptions, target: string}} options
 * @returns {{severity: string, fullyMaskedFields: Set, whiteList: Set, maskOptions: MaskDataOptions, target: string}}
 */
const mergeOptions = (options = {}) => {
  const mergedOptions = {
    ...defaultOptions,
    ...(options && typeof options === 'object' ? options : {}),
  };

  Object.keys(defaultOptions).forEach((name) => {
    if (!mergedOptions[name]) {
      mergedOptions[name] = defaultOptions[name];
    }

    if (name === 'whiteList' || name === 'fullyMaskedFields') {
      mergedOptions[name] = parseFields(mergedOptions[name]);
    }

    if (name === 'maskOptions') {
      mergedOptions[name] = logMaskOptions(mergedOptions.severity, options.maskOptions);
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
 * @param {[]} [opts.whiteList=[]] Fields that won't be masked
 * @param {[]} [opts.fullyMaskedFields=[]] // Fields that will be masked completely even if they are in the whiteList
 * @param {{}|MaskOptionsPojo} [opts.maskOptions={}] Masking options for the MaskData library. Documentation here: https://github.com/coderua/mask-data#default-options
 *
 * @type {Function}
 */
module.exports = format((info = {}, opts = { ...defaultOptions }) => {
  const { severity, target, fullyMaskedFields, whiteList, maskOptions } = mergeOptions(opts);

  const data = { ...get(info, target, {}) };

  if (Object.keys(data).length === 0) {
    // There is no data in the info object, so we return the info object
    return info;
  }

  if (severity === MASK_DATA_SEVERITY_OPEN) {
    // No need to mask data for the "open" severity
    return { ...info, [target]: data };
  }

  // Prepare mask instances
  const maskData = new MaskData(maskOptions);
  const maskDataCompletely = new MaskData({
    ...maskOptions.options,
    ...{
      // First N symbols that won't be masked
      unmaskedStartChars: 0,
      // Last N symbols that won't be masked
      unmaskedEndChars: 0,
      // Mask data with type 'string'
      maskString: true,
      // Mask data with type 'number'
      maskNumber: true,
    },
  });

  const mask = (input, path) => {
    if (!fullyMaskedFields.has(path) && whiteList.has(path)) {
      // No masking for the white listed fields that are not in the fullyMaskedFields list
      return input;
    }

    if (input !== null && typeof input === 'object') {
      const result = {};

      Object.keys(input).forEach((key) => {
        result[key] = mask(input[key], `${path}.${key}`);
      });

      return result;
    }

    return fullyMaskedFields.has(path) ? maskDataCompletely.mask(input) : maskData.mask(input);
  };

  // Masking data starting from root elements
  Object.keys(data).forEach((key) => {
    data[key] = mask(data[key], key);
  });

  return { ...info, [target]: data };
});

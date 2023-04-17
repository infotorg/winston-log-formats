const { format } = require('logform');
const { LEVEL, MESSAGE } = require('triple-beam');

const isAxiosError = (info) => {
  return (
    info.isAxiosError === true || // For Axios ^0.25.0
    info.name === 'AxiosError' // For Axios ^1.3.3
  );
};

const isAxiosRequest = (info) => {
  if (typeof info.message !== 'object') {
    return false;
  }

  const { message } = info;

  if (message?.isAxiosRequest) {
    // First attempt to identify Axios request object.
    // isAxiosRequest is a custom property that is added to Axios request object in the request interceptor,
    // and is used to identify Axios request.
    return true;
  }

  // Second attempt to identify Axios request object.
  const expectedFieldsInConfig = ['method', 'url'];
  const configFields = new Set(Object.keys(message));

  return expectedFieldsInConfig.filter((field) => configFields.has(field)).length === 2;
};

const isAxiosResponse = (info) => {
  if (typeof info.message !== 'object') {
    return false;
  }

  if (info.message?.isAxiosResponse) {
    // First attempt to identify Axios response object.
    // isAxiosResponse is a custom property that is added to Axios response object in the response interceptor,
    // and is used to identify Axios response.
    return true;
  }

  // Second attempt to identify Axios response object.
  return info.message?.config?.headers['User-Agent']?.includes('axios');
};

/**
 * Applied to errors like ECONNREFUSED, ECONNRESET, ENOTFOUND, etc.
 *
 * @type {string[]}
 */
const errorFields = ['errno', 'syscall', 'hostname', 'code', 'address', 'port'];

const getWhiteListFields = (options) =>
  [
    'url',
    'baseURL',
    'method',
    'data',
    'headers',
    'status',
    'statusText',
    // Exists for ECONNREFUSED, ECONNRESET, ENOTFOUND, etc.
    ...errorFields,
    // ^^^^^^^^
    'config',
    'xsrfCookieName',
    'xsrfHeaderName',
    'timeout',
    options?.stack ? 'stack' : null,
    'responseTime',
    // Custom field provided by axios interceptors: requestStartedAtInterceptor, requestLoggerInterceptor, errorLoggerInterceptor
    'requestStartedAt',
  ].filter(Boolean);

/**
 * Returns an object with all non axios info properties.
 * They could be provided from other formats like timestamp, request-id, etc.
 *
 * @param {Object} info
 * @returns {Object}
 */
const topLevelInfo = (info) => {
  // These keys are exist in Axios Error object
  // Do not include these keys from top level of Axios Error object
  const keys = ['config', 'request', 'response', 'isAxiosError', 'toJSON', ...errorFields];

  return Object.fromEntries(Object.entries(info).filter(([key]) => keys.includes(key) === false));
};

/**
 * Extracts meta information from Axios request, response or error object
 *
 * @param {Object} data - Axios request, response or error object
 * @param {string} reqOrResKey - 'req' or 'res'
 * @param {[]} whiteListFields - array of fields to extract
 * @returns {{req: {}, res: {} }}
 */
const extractMeta = (data, reqOrResKey, whiteListFields) => {
  const result = { [reqOrResKey]: {} };

  Object.keys(data)
    .filter((propName) => whiteListFields.includes(propName))
    .forEach((propName) => {
      if (propName === 'config') {
        // The only axios Response and Error objects have 'config' key. Request object itself is a config.
        // In Response and Error objects 'headers' key located under the 'config' key
        // Remove headers from config also if not specified in the options
        result.req = extractMeta(data[propName], 'req', whiteListFields).req;
      } else {
        result[reqOrResKey][propName] = data[propName];
      }
    });

  return result;
};

const defaultOptions = Object.freeze({
  enabled: true,
  // Description for a request
  requestDescription: 'Axios request',
  // Description for a response
  responseDescription: 'Axios response',
  // Description for an error
  errorDescription: 'Axios error',
  // If true, then request/response/error information will be included in meta
  meta: false,
  // Key name for meta property
  metaKey: 'meta',
  // If true, then error stack trace will be included in the meta
  stack: false,
});

/**
 * function axios (info)
 * Returns a new instance of the axios Format which transforms `message` property if this is an axios request/response/error
 * and adds this information into `metaKey` property in the message.
 *
 * If the `message` property of the `info` object is an instance of `AxiosError`,
 * replace the `Error` object its own `message` property and meta information.
 *
 * @param {Object|Error} [axiosInfo={}] The info parameter provided to a given format represents a single log message. The object itself is mutable. Every info must have at least the level and message properties.
 * @param {string|{}} axiosInfo.message Error message or request/response object. Required
 * @param {string} axiosInfo.level Log level. Required
 * @param {string|undefined} [axiosInfo.label=undefined] Log label. Optional
 *
 * @param {Object} [opts={meta: false, metaKey: 'meta', requestDescription: 'Axios request', responseDescription: 'Axios response', errorDescription: 'Axios error', stack: false}] Setting specific options to the current instance of the format. Example: { headers: true, meta: true, metaKey: 'meta', requestDescription: 'Axios request', responseDescription: 'Axios response', errorDescription: 'Axios error', stack: true }
 *
 * @param {string} [opts.enabled=true] Toggle axios format output.
 * @param {string} [opts.requestDescription='Axios request'] Description for a Request.
 * @param {string} [opts.responseDescription='Axios response'] Description for a Response.
 * @param {string} [opts.errorDescription='Axios error'] Description for an Error.
 * @param {boolean} [opts.meta=false] If true, then request/response/error information will be included in meta.
 * @param {string} [opts.metaKey='meta'] Key name for meta property.
 * @param {boolean} [opts.stack=false] If true, then error stack trace will be included in the meta.
 *
 * @returns {Function}
 */
module.exports = format((axiosInfo = {}, opts = { ...defaultOptions }) => {
  if (!axiosInfo || typeof axiosInfo !== 'object' || Object.keys(axiosInfo).length === 0) {
    // This is not a log object
    return {};
  }

  if (opts && opts.enabled === false) {
    // Format is disabled, so we return the info object
    return axiosInfo;
  }

  if (!isAxiosError(axiosInfo) && !isAxiosResponse(axiosInfo) && !isAxiosRequest(axiosInfo)) {
    // Not an axios Error/Request/Response
    return axiosInfo;
  }

  const options = Object.keys(opts).length ? { ...defaultOptions, ...opts } : { ...defaultOptions };

  const { metaKey } = options;

  // Initialize result log object
  const info = {
    ...topLevelInfo(axiosInfo),
    level: axiosInfo.level,
    [LEVEL]: axiosInfo[LEVEL] || axiosInfo.level,
    message: axiosInfo.message,
    [MESSAGE]: axiosInfo[MESSAGE] || axiosInfo.message,
    [metaKey]: {},
  };

  // Object with meta information for request or response
  let meta;
  // req or res key in 'meta' object
  let metaResultProp = 'res';

  if (isAxiosError(axiosInfo)) {
    // Axios error
    info.description = axiosInfo.description || options.errorDescription;

    if (axiosInfo.request && !axiosInfo.response) {
      // Request was made but no response was received
      // `axiosInfo.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
      // Used for errors like ECONNREFUSED, ECONNRESET, ENOTFOUND, etc.

      // Technically there is no response here, but to make it more understandable in logs what was requested,
      // and what was a "response" we make it compatible with response format.
      // Example of what will be logged for the 'ENOTFOUND' error:
      // {
      //   "description": "Axios Error",
      //   "label": "development",
      //   "level": "error",
      //   "message": "getaddrinfo ENOTFOUND media.xy",
      //   "meta": {
      //     "req": {
      //       "headers": {
      //         "Accept": "application/json, text/plain, */*",
      //         "User-Agent": "axios/1.3.3"
      //       },
      //       "method": "get",
      //       "requestStartedAt": 1673964871763,
      //       "timeout": "0",
      //       "url": "http://media.xy/eee",
      //     },
      //     "res": {
      //       "code": "ENOTFOUND",
      //       "status": null
      //     }
      //   },
      //   "timestamp": "2023-02-07 17:53:36.730"
      // }
      const { config, message, stack, code, status } = axiosInfo.toJSON();
      const { errno, syscall, hostname, address, port } = axiosInfo;

      info.message = message;

      if (options.meta) {
        meta = {
          errno,
          code,
          syscall,
          hostname,
          address,
          port,
          status,
          config,
          stack,
        };
      }
    }

    if (axiosInfo.response) {
      // Axios Error when server response with some status code
      const {
        config: { url, method, baseURL },
        status,
        statusText,
        responseTime,
      } = axiosInfo.response;

      info.message = [
        String(method).toUpperCase(),
        baseURL ? new URL(url, baseURL).href : url,
        status,
        statusText,
        responseTime ? `${responseTime}ms` : null,
      ]
        .filter(Boolean)
        .join(' ');

      // Example of what will be logged for the '404 Not Found' error:
      // {
      //     "description": "Axios Error",
      //     "label": "development",
      //     "level": "error",
      //     "message": "GET http://localhost:1337/uploads/search_1bff605b0f1.svg 404 Not Found 18ms",
      //     "meta": {
      //         "req": {
      //             "headers": {
      //                 "Accept": "application/json, text/plain, */*",
      //                 "User-Agent": "axios/1.3.3"
      //             },
      //             "method": "get",
      //             "requestStartedAt": 1673964813765,
      //             "timeout": "0",
      //             "url": "http://localhost:1337/uploads/search_1bff605b0f1.svg",
      //         },
      //         "res": {
      //             "data": {
      //                 "data": null,
      //                 "error": {
      //                     "details": {},
      //                     "message": "Not Found",
      //                     "name": "NotFoundError",
      //                     "status": 404
      //                 }
      //             },
      //             "headers": {
      //                 "accept-ranges": "bytes",
      //                 "content-length": "94",
      //                 "content-type": "application/json; charset=utf-8",
      //             },
      //             "status": 404,
      //             "statusText": "Not Found"
      //         }
      //     },
      //     "timestamp": "2023-02-07 17:53:36.730"
      // }

      if (options.meta) {
        meta = {
          ...axiosInfo.response,
        };
      }
    }
  }

  if (isAxiosRequest(axiosInfo)) {
    metaResultProp = 'req';

    info.description = axiosInfo.description || options.requestDescription;

    const request = axiosInfo.message;
    const {
      url,
      baseURL,
      method,
      // Other available keys in req:
      // data,
      // headers,
    } = request;

    info.message = [method.toUpperCase(), baseURL ? new URL(url, baseURL).href : url].filter(Boolean).join(' ');

    if (options.meta) {
      meta = {
        ...request,
      };
    }
  }

  if (isAxiosResponse(axiosInfo)) {
    // Axios request or response
    info.description = axiosInfo.description || options.responseDescription;

    const {
      config: { url, method, baseURL },
      status,
      statusText,
      responseTime,
      // Other available keys in res:
      // data,
      // headers,
    } = axiosInfo.message;

    // Create a basic message with HTTP method, url, response code and response time:
    // POST https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/ 200 OK 189ms
    info.message = [
      String(method).toUpperCase(),
      baseURL ? new URL(url, baseURL).href : url,
      status,
      statusText,
      responseTime ? `${responseTime}ms` : null, // add response time if it exists
    ]
      .filter(Boolean)
      .join(' ');

    if (options.meta) {
      meta = {
        ...axiosInfo.message,
      };
    }
  }

  if (!options.meta) {
    // No need to add meta information to the log message
    return info;
  }

  try {
    info[metaKey] = extractMeta(meta, metaResultProp, getWhiteListFields(options));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  return info;
});

# @infotorg/winston-log-formats

Infotorg log formats for Winston logger.

- [Axios](#axios)
- [Description](#description)
- [Filter](#filter)
- [Mask](#mask)
- [Request ID](#request-id)
- [Track ID](#track-id)

Formats are fully compatible with [Winston](https://github.com/winstonjs/logform) and could be combined with other formats.

## Installation

```
npm install @infotorg/winston-log-formats
```

## Usage

> The order of combining formats is important.
> Formats are applying in the same order as they passed into `combine` function. See example below.

```javascript
const { format } = require('logform');
// All custom Infotorg Log formats for Winston
const { axios, description, filter, mask, requestId, trackId } = require('@infotorg/winston-log-formats');

const { MASK_DATA_SEVERITY_PARTIAL } = require('@infotorg/mask-data-severity-levels');

const infotorgFormat = format.combine(
  axios({ 
    enabled: true,
    meta: true, 
    errorStack: true,
  }),
  description({ description: 'Your default description' }),
  // Configuration for the "filter" format
  filter({
    target: 'meta',
    blackList: [
      'req.headers.common',
      'req.headers.delete',
      'req.headers.get',
      // ...
    ],
  }),

  // Configuration for the "mask" format
  mask({
    severity: MASK_DATA_SEVERITY_PARTIAL,
    target: 'meta',
    // More details about maskOptions you can find in the https://github.com/coderua/mask-data#default-options.
    maskOptions: {
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
    },
    whiteList: [
      'res.status',
      'res.method',
      // Headers
      'res.headers.accept-ranges',
      'res.headers.x-powered-by',
      'res.headers.vary',
      'res.statusText',
      // Errors related fields
      'res.errno',
      'res.code',
      'res.stack',
      'res.data.error',
      // ...
      'req.timeout',
      'req.httpVersion',
      'req.originalUrl',
      'req.baseURL',
      'req.url',
      'req.method',
      // ...
    ],
  }),
  requestId({ generateRequestIdFn: () => 'Your request ID' }),
  trackId({ trackId: () => 'Your track ID' }),
  // Other finalizing formats...
  format.json()
);
```

## Axios

The `axios` format performs the following actions with the `info` object

1. Detect if the `message` property is an Axios Request/Response object or if info itself an Axios Error.
2. Transform Axios Request/Response and Error objects.
3. Create a `meta` information depends on a result or error.
4. Add response time to the log message if `requestStartedAt` property is set. Which can be done by using [axios interceptors](https://axios-http.com/docs/interceptors).
5. Adds a result to the `meta` property (or any other that is set in the `metaKey` option).

It accepts the following options:

- **enabled**: Enable/disable axios format output. If set to `false` then it just pass through the info object and do nothing. Default value is `true`.
- **requestDescription**: Description for a Request. Default value is `Axios request`.
- **responseDescription**: Description for a Response. Default value is `Axios response`.
- **errorDescription**: Description for an Error. Default value is `Axios error`.
- **meta**: Enable/disable including meta information about request/response/error. Default value is `false`.
- **metaKey**: Key name for meta property. Default value is `meta`.
- **stack**: If true, then error stack trace will be included in the meta. Default value is `false`.


> **IMPORTANT!** It should be applied as one of the first Infotorg custom formats in the combine pipeline.
> Because it creates a proper structure for the next formats. Before `filter`, `mask` and other finalizing formats like `errors` and `json`.

> Most convenient using this format together with axios [interceptors](https://axios-http.com/docs/interceptors). See example below.


```javascript
const axios = require('axios');

axios.interceptors.request.use(
  function (config) {
    // Add time when a request is started
    if (!config.requestStartedAt) {
      config.requestStartedAt = new Date().getTime();
    }

    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);
```

### Format Axios Request only

```js
const { axios } = require('@infotorg/winston-log-formats');

// Simulate Axios Request Config
// It will be cought by axios interceptor and sent to logger
const request = {
  url: '/api/login',
  method: 'post',
  data: { name: 'John', password: 'super-secret-passwd' },
  headers: {
    common: { Accept: 'application/json, text/plain, */*' },
    'Content-Type': 'application/json',
    'User-Agent': 'axios/1.3.3',
    'Content-Length': 49,
  },
  baseURL: 'https://example.com',
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  requestStartedAt: 1676736693452,
};

// Transform Axios Request to a log message
const info = axios().transform(
  // Log entry
  {
    level: 'info',
    message: request,
  },
  // Options
  { meta: true }
);

console.log(info);
// { level: 'info',
//   message: 'POST https://example.com/api/login',
//   description: 'Axios request',
//   meta: {
//     req: {
//       baseURL: 'https://example.com',
//       data: {
//         name: 'John',
//         password: 'super-secret-passwd',
//       },
//       headers: {
//        common: { Accept: 'application/json, text/plain, */*' },
//        'Content-type': 'application/json',
//        'User-Agent': 'axios/1.3.3',
//        'Content-Length': 49,
//       },
//       method: 'post',
//       url: '/api/login',
//       timeout: '0',
//       requestStartedAt: 1676736693452
//     }
//   }
// }
```

### Format Axios Request and Response

```js
const { axios } = require('@infotorg/winston-log-formats');

// Simulate Axios Response
// It will be cought by axios interceptor and sent to logger
const response = {
  status: 200,
  statusText: 'OK',
  headers: {
    'content-length': '3513',
    'content-type': 'application/json',
    date: 'Sat Feb 18 2023 17:16:25 GMT',
    connection: 'close',
  },
  // Axios Request config
  config: {
    url: '/api/login',
    method: 'post',
    data: { name: 'John', password: 'super-secret-passwd' },
    headers: {
      common: { Accept: 'application/json, text/plain, */*' },
      'Content-Type': 'application/json',
      'User-Agent': 'axios/1.3.3',
      'Content-Length': 49,
    },
    baseURL: 'https://example.com',
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    requestStartedAt: 1676736693452,
  },
  responseTime: 100,
};

// Transform Axios Response to log message
const info = axios().transform(
  // Log entry
  {
    level: 'info',
    message: response,
  },
  // Options
  { meta: true }
);

console.log(info);
// { level: 'info',
//   message: 'POST https://example.com/api/login 200 OK 100ms',
//   description: 'Axios reponse',
//   meta: {
//     req: {
//       baseURL: 'https://example.com',
//       data: { name: 'John', password: 'super-secret-passwd' },
//       headers: {
//         Accept: 'application/json, text/plain, */*',
//         'Content-Length': 49,
//         'Content-Type': 'application/json',
//         'User-Agent': 'axios/1.3.3',
//       },
//       method: 'post',
//       requestStartedAt,
//       url: '/api/login',
//       xsrfCookieName: 'XSRF-TOKEN',
//       xsrfHeaderName: 'X-XSRF-TOKEN',
//     },
//     res: {
//       headers: {
//         'content-length': '2',
//         'content-type': 'application/json',
//       },
//       status: 200,
//       statusText: 'OK',
//       responseTime: 100
//     }
//   }
// }
```

### Format Axios Network Error ([ECONNREFUSED, ECONNRESET, ENOTFOUND, etc.](https://nodejs.org/api/errors.html))

> Network errors are errors that occur when an underlying operation fails due to a network error. These errors are usually generated by the operating system and are usually related to the network stack.
> This kind of errors won't have a response object. That's why we add error information to `meta.res` key to keep the same structure as for response logs.

- `ECONNREFUSED` (Connection refused): No connection could be made because the target machine actively refused it. This usually results from trying to connect to a service that is inactive on the foreign host.
- `ECONNRESET` (Connection reset by peer): A connection was forcibly closed by a peer. This normally results from a loss of the connection on the remote socket due to a timeout or reboot. Commonly encountered via the http and net modules.
- `ENOTFOUND` (DNS lookup failed): Indicates a DNS failure of either `EAI_NODATA` or `EAI_NONAME`. This is not a standard POSIX error.

For examples bellow we will use a helper to generate Axios Error. No need to use this in the real world it's a part of axios.

```javascript
// Helper for creation an axios error
function createAxiosError(message, config, code, request, response) {
  const error = new Error(message);

  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null,
    };
  };

  return error;
}
```

```js
const { axios } = require('@infotorg/winston-log-formats');

// Simulate creating an Axios Network error
const message = 'connect ECONNREFUSED 127.0.0.1:3333';
const code = 'ECONNREFUSED';
const config = {
  headers: {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'axios/1.3.3',
  },
  method: 'get',
  url: 'http://localhost:3333',
  requestStartedAt,
  data: undefined,
};
const request = {
  method: 'GET',
  path: '/',
  host: 'localhost',
  protocol: 'http:',
};

// This Axios Network Error that will be cought by axios interceptor and sent to logger
const axiosError = Object.assign(createAxiosError(message, config, code, request), {
  level: 'error',
  errno: -61,
  code,
  syscall: 'connect',
  hostname: 'localhost',
  address: '127.0.0.1',
  port: 3333,
});

// Transform Axios Network Error to log message
const error = axios().transform(
  // Error instance (log entry)
  axiosError,
  // Options
  { meta: true, stack: true }
);

console.log(error);
// { level: 'error',
//   message: 'connect ECONNREFUSED 127.0.0.1:3333',
//   meta:
//    { res:
//      { errno: -61,
//          code: 'ECONNREFUSED',
//          syscall: 'connect',
//          hostname: 'localhost',
//          address: '127.0.0.1',
//          port: 3333,
//          stack: 'Error: connect ECONNREFUSED 127.0.0.1:3333\n    at ...',
//          status: null },
//      req:
//       { headers:
//          { Accept: 'application/json, text/plain, */*',
//            'User-Agent': 'axios/1.3.3' },
//         method: 'get',
//         url: 'http://localhost:3333',
//         requestStartedAt: 1675770391875,
//         data: undefined } },
//   description: 'Axios error',
//   [Symbol(level)]: 'error',
//   [Symbol(message)]: 'connect ECONNREFUSED 127.0.0.1:3333' }
```

### Format Axios HTTP Error ("401 Unauthorized", "404 Not Found", "500 Internal Server Error" etc.)

> Any status codes that falls outside the range of 2xx cause these errors.

```js
const { axios } = require('@infotorg/winston-log-formats');

// Simulate creating an Axios Network error
const code = ''; // Make sense only for Network errors like ECONNREFUSED, ECONNRESET, ENOTFOUND, etc.
const message = 'Request failed with status code 404';
const config = {
  timeout: 0,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  maxContentLength: -1,
  maxBodyLength: -1,
  headers: {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'axios/1.3.3',
  },
  method: 'get',
  url: 'https://example.com:1337/uploads/non-existent.svg',
  requestStartedAt: 1675770391875,
  data: undefined,
};
const request = {
  method: 'GET',
  path: '/uploads/non-existent.svg',
  host: 'example.com',
  protocol: 'https:',
};
const response = {
  status: 404,
  statusText: 'Not Found',
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'content-length': '94',
    date: 'Sat Feb 18 2023 17:16:25 GMT',
    connection: 'close',
  },
  config,
  data: {
    data: null,
    error: { status: 404, name: 'NotFoundError', message: 'Not Found', details: {} },
  },
  responseTime: 100,
};

// This Axios HTTP Error that will be cought by axios interceptor and sent to logger
const axiosError = Object.assign(createAxiosError(message, config, code, request, response), { level: 'warn' });

// Transform Axios Network Error to log message
const error = axios().transform(
  // Error instance (log entry)
  axiosError,
  // Options
  { meta: true }
);

console.log(error);
// { level: 'warn',
//   message: 'GET https://example.com:1337/uploads/non-existent.svg 404 Not Found 100ms',
//   meta:
//    { res:
//      { status: 404,
//        statusText: 'Not Found',
//        data:
//          { data: null,
//            error:
//             { status: 404,
//               name: 'NotFoundError',
//               message: 'Not Found',
//               details: {} } },
//        responseTime: 100 },
//      req:
//       { timeout: '0',
//         xsrfCookieName: 'XSRF-TOKEN',
//         xsrfHeaderName: 'X-XSRF-TOKEN',
//         method: 'get',
//         url: 'https://example.com:1337/uploads/non-existent.svg',
//         requestStartedAt: 1675770391875,
//         data: undefined } },
//   description: 'Axios error',
//   [Symbol(level)]: 'warn',
//   [Symbol(message)]: 'Request failed with status code 404' }
```

## Description

The `description` format adds the `description` property to the `info` object.
It accepts the following options:

- **description**: As a sting. If set then it applies to the log message. But if info object already has `description` property then it won't be overwritten.

```javascript
// Description from opts object
const { description } = require('@infotorg/winston-log-formats');

const info = description().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
  },
  // Options
  { description: 'API request' }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   description: 'API request' }
```

```javascript
// Description from info object
const { description } = require('@infotorg/winston-log-formats');

const info = description().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
    // Owerride description from opts object
    description: 'Info description',
  },
  // Options
  { description: 'API request' }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   description: 'Info description' }
```

## Filter

The `filter` format removes provided `blackList` fields in the log message:

It accepts the following options:

- **enabled**: Enable/disable filter format output. Default value is `true`.
- **target**: Target property for filtering in the info object. Default value is `meta`.
- **blackList**: Fields that will be removed from the info object. It supports `dot notation` in the field names. Default value is `[]`. Example: `['req.data.password', 'req.headers.token', 'res.data.sensitive']`.

> Dot notation is one way to access a property of an object. To use dot notation, write the name of the object, followed by a dot (.), followed by the name of the property.

### Filter format usage

```javascript
const { filter } = require('@infotorg/winston-log-formats');

const info = filter().transform(
  // Log entry
  {
    level: 'info',
    message: 'Test',
    meta: {
      req: {
        url: 'htts://example.com',
        method: 'post',
        headers: {
          'X-Session': 'KdshmBaCdZdWxQ5yTpix.RCJmD7YONqSWyjhfzoP5',
          'Content-type': 'application/json',
        },
        body: {
          sensitive: 'sensitive data',
          username: 'John',
        },
        requestStartedAt: 1675770391875,
      },
    },
  },
  // Manual options
  { enabled: true, target: 'meta', blackList: ['body.sensitive', 'headers', 'requestStartedAt'] }
);

console.log(info);
// { message: 'Test',
//   meta:
//    { req:
//      { url: 'htts://example.com',
//          method: 'post',
//          body: { username: 'John' } } } }
```

## Mask

The `mask` format masks sensitive data in the log message depends on provided options.

It accepts the following options:

- **enabled**: Enable/disable filter format output. Default value is `true`.
- **severity**: Severity for masking data in a log. Default value is `partial`. Possible values are `open`, `partial`, and `strict`. For more details, see [mask data severity levels](https://github.com/infotorg/mask-data-severity-levels) file.
- **target**: property name in the log to mask. Default value is `meta`. It supports `dot notation` in the field names. Example: `meta.req`.
- **whiteList**: Fields that won't be masked. It supports `dot notation` in the field names. Default value is `[]` that means all fields will be masked. Example: `['req.data.username']`.
- **fullyMaskedFields**: Fields that will be masked completely even if they are in the `whiteList`. It supports `dot notation` in the field names. Default value is `[]`. Example: `['req.data.password']`.
- **maskOptions**: Masking options for the [MaskData](https://github.com/coderua/mask-data) library. Default value is `{}`.


> It should be applied as one of the last formats in the combine pipeline. After the `axios` and `filter` format but before finalizing formats like `json` and `errors`.

```javascript
const { createLogger, format } = require('winston');
const { combine, errors, json, label, timestamp } = format;

const logger = createLogger({
  level: loggerLevel,
  format: combine(
    label({
      label: 'my-app',
    }),
    timestamp(),
    // ...
    requestId(),
    axios({
      // Options...
    }),
    filter({
      // Options...
    }),

    // ----------------------
    // Here is the proper place for the `mask` format
    // ----------------------
    mask({
      // Options...
    }),

    errors({
      // Options...
    }),
    json()
    // Other finalizing formats...
  ),
  transports: [],
  // Other logger options...
});
```

### Mask format usage

```javascript
const { mask } = require('@infotorg/winston-log-formats');
const { MASK_DATA_SEVERITY_PARTIAL } = require('@infotorg/mask-data-severity-levels');

const info = mask().transform(
  // Log entry
  {
    level: 'info',
    message: 'Test',
    meta: {
      req: {
        data: {
          sensitive: 'your sensitive data',
          password: 'super-secret-passwd',
        },
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'axios/1.3.3',
          'X-SENSITIVE-HEADER': 'your sensitive header',
        },
        method: 'get',
        requestStartedAt: 1675770391875,
        timeout: 0,
        url: 'https://example.com:1337/uploads/non-existent.svg',
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
      },
      res: {
        data: {
          data: { sensitive: 'Sensitive data - only for a client' },
          error: { details: {}, message: 'Not Found', name: 'NotFoundError', status: 404 },
        },
        headers: {
          'content-length': '94',
          'content-type': 'application/json; charset=utf-8',
          date: 'Sat Feb 18 2023 17:16:25 GMT',
        },
        responseTime: 100,
        status: 404,
        statusText: 'Not Found',
      },
    },
  },
  // Manual options
  {
    enabled: true,
    severity: MASK_DATA_SEVERITY_PARTIAL,
    target: 'meta',
    // Options for mask data compatible with @coder.ua/mask-data package.
    // Documentation: https://github.com/coderua/mask-data#default-options
    maskOptions: {
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
      // Mask 'number' data
      maskNumber: true,
    },
    whiteList: [
      // Request related fields
      'req.url',
      'req.method',
      // Response related fields
      'res.status',
      'res.method',
      'res.headers.content-length',
      'res.headers.content-type',
      'res.statusText',
      // Errors related fields
      'res.data.error',

      // ...
    ],
    fullyMaskedFields: ['req.data.password'],
  }
);

console.log(info);
// { message: 'Test',
//   meta:
//    { req:
//      { data: { sensitive: 'yo***************ta', password: '****************' },
//          headers:
//           { Accept: 'application/json, text/plain, */*',
//             'User-Agent': 'ax********.0',
//             'X-SENSITIVE-HEADER': 'yo*****************er' },
//          method: 'get',
//          requestStartedAt: 16*********75,
//          timeout: '*',
//          url: 'https://example.com:1337/uploads/non-existent.svg',
//          xsrfCookieName: 'XSRF-TOKEN',
//          xsrfHeaderName: 'X-XSRF-TOKEN' },
//      res:
//        { data:
//          { data: { sensitive: 'Se**************************nt' },
//              error:
//               { details: {},
//                  message: 'Not Found',
//                  name: 'NotFoundError',
//                  status: 404 } },
//          headers:
//            { 'content-length': '94',
//              'content-type': 'application/json; charset=utf-8',
//              date: 'Sat Feb 18 2023 17:16:25 GMT' },
//          responseTime: 100,
//          status: 404,
//          statusText: 'Not Found' } } }
```

## Request ID

The `requestId` format adds the `requestId` field to each log message.

It accepts the following options:

- **generateRequestIdFn**: As a function that generates requestId. If info object already has `requestId` property then it won't be overwritten.

```javascript
// Use generateRequestIdFn option to generate requestId
const { requestId } = require('@infotorg/winston-log-formats');

const info = requestId().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
  },
  // Options
  { generateRequestIdFn: () => '123456-test-request-id' }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   requestId: '123456-test-request-id' }
```

```javascript
// Use info.requestId instead of generateRequestIdFn option
const { requestId } = require('@infotorg/winston-log-formats');

const info = requestId().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
    requestId: 'request-id-from-info',
  },
  // Options
  { generateRequestIdFn: () => '123456-test-request-id' }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   requestId: 'request-id-from-info' }
```

## Track ID

The `trackId` format adds the `trackId` field to each log message. It could be used to add some tracking information to each log message.

It accepts the following options:

- **enabled**: Enable/disable `trackId` output. Default is `true`.
- **trackId**: As a function that generates `trackId` or exact value. It binds `info` object as a last argument. If `info` object already has `trackId` property then it won't be overwritten.
- **key**: Field name/key to use for the trackId in log output. Default is `trackId`.

> Log entry `info.trackId` has a higher priority than the `opts.trackId`.

```javascript
// Use trackId option (opts.trackId) as a function to generate trackId
const { trackId } = require('@infotorg/winston-log-formats');

const info = trackId().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
  },
  // Options
  { enabled: true, trackId: (info) => '123456-test-track-id' }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   trackId: '123456-test-track-id' }
```

```javascript
// Use custom trackId key option (opts.key)
const { trackId } = require('@infotorg/winston-log-formats');

const info = trackId().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
  },
  // Options
  {
    trackId: (info) => '123456-test-track-id',
    key: 'customTrackId',
  }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   customTrackId: '123456-test-track-id' }
```

```javascript
// Use trackId option (opts.trackId) as a function with access to info object to generate trackId
const { trackId } = require('@infotorg/winston-log-formats');

const info = trackId().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
    node: 'node1',
  },
  // Options
  { trackId: (info) => `${info.node}:123456-test-track-id` }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   trackId: 'node1:123456-test-track-id' }
```

```javascript
// Use info.trackId value instead of trackId option (opts.trackId)
const { trackId } = require('@infotorg/winston-log-formats');

const info = trackId().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
    trackId: 'track-id-from-info',
  },
  // Options
  { trackId: (info) => '123456-test-track-id' }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   trackId: 'track-id-from-info' }
```

```javascript
// Use info.trackId as a function instead of trackId option (opts.trackId)
const { trackId } = require('@infotorg/winston-log-formats');

const info = trackId().transform(
  // Log entry
  {
    level: 'info',
    message: 'my message',
    trackId: (info) => 'track-id-from-info-fn',
  },
  // Options
  { trackId: (info) => '123456-test-track-id' }
);

console.log(info);
// { level: 'info',
//   message: 'my message',
//   trackId: 'track-id-from-info-fn' }
```

## Tests

Tests are written with `jest`. They can be run with `npm`:

```
npm run test
```

##### LICENSE: MIT

##### AUTHOR: [Volodymyr Chumak](https://github.com/coderua)

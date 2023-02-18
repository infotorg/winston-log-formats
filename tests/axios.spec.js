const { AxiosError } = require('axios');
const axiosLogFormat = require('../src/axios');

describe('Tests "axios" Log format', () => {
  // Sat Feb 18 2023 16:49:18 GMT+0100 (Central European Standard Time)
  const requestStartedAt = 1676735337786;

  test('it should be a function', () => {
    expect(typeof axiosLogFormat === 'function').toBe(true);
  });

  test('it should return Format wrapper object', () => {
    expect(typeof axiosLogFormat() === 'object').toBe(true);
  });

  test('it should NOT add axios meta information for non axios request/response/error info object', () => {
    const info = axiosLogFormat().transform({ message: 'Not axios request/response' });

    expect(info).toStrictEqual({ message: 'Not axios request/response' });
  });

  describe('For Request', () => {
    const axiosRequestConfig = Object.freeze({
      url: '/',
      method: 'post',
      data: {
        product: 'hentEiersoek',
        data: { fornavn: 'Anngrim', etternavn: 'Olsvik' },
      },
      timeout: 0,
      headers: {
        common: { Accept: 'application/json, text/plain, */*' },
        'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
        'Content-type': 'application/json',
        delete: {},
        get: {},
        head: {},
        post: { 'Content-Type': 'application/x-www-form-urlencoded' },
        put: { 'Content-Type': 'application/x-www-form-urlencoded' },
        patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      baseURL: 'https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/',
      requestStartedAt,
      // This property is added by axios request interceptor
      isAxiosRequest: true,
    });
    const expectedMeta = {
      req: {
        baseURL: 'https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/',
        data: { data: { etternavn: 'Olsvik', fornavn: 'Anngrim' }, product: 'hentEiersoek' },
        method: 'post',
        requestStartedAt,
        timeout: 0,
        url: '/',
        headers: {
          'Content-type': 'application/json',
          'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
          common: { Accept: 'application/json, text/plain, */*' },
          delete: {},
          get: {},
          head: {},
          patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
          post: { 'Content-Type': 'application/x-www-form-urlencoded' },
          put: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      },
    };

    const level = 'debug';
    const message = 'POST https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/';
    const description = 'Axios request';

    test('it should NOT add axios request meta information if "meta" is disabled in opts', () => {
      const info = axiosLogFormat().transform({ level, message: axiosRequestConfig }, { meta: false });

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe(description);
      expect(info.meta).toStrictEqual({});
    });

    test('it should add axios request meta information in the info object', () => {
      const info = axiosLogFormat().transform({ level, message: axiosRequestConfig }, { meta: true });

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe(description);

      expect(info.meta).toStrictEqual(expectedMeta);
    });

    test('it should add axios request meta information without headers in the info object', () => {
      const info = axiosLogFormat().transform({ level, message: axiosRequestConfig }, { headers: false, meta: true });

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.meta).toStrictEqual({
        req: {
          baseURL: 'https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/',
          data: { data: { etternavn: 'Olsvik', fornavn: 'Anngrim' }, product: 'hentEiersoek' },
          headers: {
            'Content-type': 'application/json',
            'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
            common: { Accept: 'application/json, text/plain, */*' },
            delete: {},
            get: {},
            head: {},
            patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
            post: { 'Content-Type': 'application/x-www-form-urlencoded' },
            put: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
          method: 'post',
          requestStartedAt,
          timeout: 0,
          url: '/',
        },
      });
    });

    test('it should add axios request meta information in the info object at the custom "axios" meta key', () => {
      const metaKey = 'axios';
      const info = axiosLogFormat().transform({ level, message: axiosRequestConfig }, { meta: true, metaKey });

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe(description);
      expect(info[metaKey]).toStrictEqual(expectedMeta);
    });

    test('it should add axios request meta information in the info object with a custom request description', () => {
      const requestDescription = 'HTTP client request';
      const info = axiosLogFormat().transform(
        { level, message: axiosRequestConfig },
        { meta: true, requestDescription }
      );

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe(requestDescription);
      expect(info.meta).toStrictEqual(expectedMeta);
    });
  });

  describe('For Response', () => {
    let res;
    const level = 'debug';
    const message = 'POST https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/ 200 OK 100ms';
    const description = 'Axios response';

    beforeEach(() => {
      res = Object.freeze({
        status: 200,
        statusText: 'OK',
        headers: {
          'content-length': '3513',
          'content-type': 'application/json',
          date: 'Mon Feb 06 2023 13:35:00 GMT',
          'server-timing': 'dtRpid;desc="958029972"',
          connection: 'close',
        },
        config: {
          url: '/',
          method: 'post',
          data: '{"product":"hentEiersoek","data":{"fornavn":"Anngrim","etternavn":"Olsvik"}}',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
            'User-Agent': 'axios/0.21.1',
            'Content-Length': 76,
          },
          baseURL: 'https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/',
          xsrfCookieName: 'XSRF-TOKEN',
          xsrfHeaderName: 'X-XSRF-TOKEN',
          requestStartedAt,
        },
        responseTime: 100,
        // This property is added by axios response interceptor
        isAxiosResponse: true,
      });
    });

    test('it should add axios response meta information in the info object', () => {
      const info = axiosLogFormat().transform({ level, message: res }, { meta: true });

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe(description);
      expect(info.meta).toStrictEqual({
        req: {
          baseURL: 'https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/',
          data: '{"product":"hentEiersoek","data":{"fornavn":"Anngrim","etternavn":"Olsvik"}}',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Length': 76,
            'Content-Type': 'application/json',
            'User-Agent': 'axios/0.21.1',
            'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
          },
          method: 'post',
          requestStartedAt,
          url: '/',
          xsrfCookieName: 'XSRF-TOKEN',
          xsrfHeaderName: 'X-XSRF-TOKEN',
        },
        res: {
          headers: {
            connection: 'close',
            'content-length': '3513',
            'content-type': 'application/json',
            date: 'Mon Feb 06 2023 13:35:00 GMT',
            'server-timing': 'dtRpid;desc="958029972"',
          },
          responseTime: 100,
          status: 200,
          statusText: 'OK',
        },
      });
    });

    test('it should add axios response meta information in the info object at the custom "axios" meta key', () => {
      const metaKey = 'axios';
      const info = axiosLogFormat().transform({ level, message: res }, { meta: true, metaKey });

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe(description);
      expect(info[metaKey]).toStrictEqual({
        req: {
          baseURL: 'https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/',
          data: '{"product":"hentEiersoek","data":{"fornavn":"Anngrim","etternavn":"Olsvik"}}',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Length': 76,
            'Content-Type': 'application/json',
            'User-Agent': 'axios/0.21.1',
            'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
          },
          method: 'post',
          requestStartedAt,
          url: '/',
          xsrfCookieName: 'XSRF-TOKEN',
          xsrfHeaderName: 'X-XSRF-TOKEN',
        },
        res: {
          headers: {
            connection: 'close',
            'content-length': '3513',
            'content-type': 'application/json',
            date: 'Mon Feb 06 2023 13:35:00 GMT',
            'server-timing': 'dtRpid;desc="958029972"',
          },
          responseTime: 100,
          status: 200,
          statusText: 'OK',
        },
      });
    });

    test('it should NOT add axios response meta information in the info object if "meta" is disabled in opts', () => {
      const info = axiosLogFormat().transform({ level, message: res }, { meta: false });

      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe(description);
      expect(info.meta).toStrictEqual({});
    });

    test('it should pass through other properties in the axios format', () => {
      const info = axiosLogFormat().transform(
        { message: res, requestId: '1234-request-id', timestamp: '2023-02-07 17:53:36.730' },
        { headers: false, meta: true }
      );

      expect(info.message).toBe(message);
      expect(info.requestId).toBe('1234-request-id');
      expect(info.timestamp).toBe('2023-02-07 17:53:36.730');
      expect(info.description).toBe(description);
      expect(info.meta).toStrictEqual({
        req: {
          baseURL: 'https://spin-tm-proxy.infotorg-eastnor-test.dds.evry.cloud/',
          data: '{"product":"hentEiersoek","data":{"fornavn":"Anngrim","etternavn":"Olsvik"}}',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Length': 76,
            'Content-Type': 'application/json',
            'User-Agent': 'axios/0.21.1',
            'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
          },
          method: 'post',
          requestStartedAt,
          url: '/',
          xsrfCookieName: 'XSRF-TOKEN',
          xsrfHeaderName: 'X-XSRF-TOKEN',
        },
        res: {
          headers: {
            connection: 'close',
            'content-length': '3513',
            'content-type': 'application/json',
            date: 'Mon Feb 06 2023 13:35:00 GMT',
            'server-timing': 'dtRpid;desc="958029972"',
          },
          responseTime: 100,
          status: 200,
          statusText: 'OK',
        },
      });
    });
  });

  describe('For HTTP "404 Not Found" Response Error', () => {
    let axiosError;
    const message = 'Request failed with status code 404';
    const description = 'Axios error';
    const level = 'warn';

    beforeEach(() => {
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
        url: 'http://localhost:1337/uploads/non-existent.svg',
        requestStartedAt,
        data: undefined,
      };
      const request = {
        method: 'GET',
        path: '/uploads/non-existent.svg',
        host: 'localhost',
        protocol: 'http:',
      };
      const response = {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '94',
          date: 'Mon, 06 Feb 2023 15:48:16 GMT',
          connection: 'close',
        },
        config,
        data: {
          data: null,
          error: { status: 404, name: 'NotFoundError', message: 'Not Found', details: {} },
        },
        responseTime: 100,
      };

      axiosError = Object.assign(new AxiosError(message, '', config, request, response), { level });
    });

    test('it should add axios error response meta information in the info object for response', () => {
      const info = axiosLogFormat().transform(axiosError, { meta: true });

      expect(info.level).toBe(level);
      expect(info.message).toMatch(/GET http:\/\/localhost:1337\/uploads\/non-existent\.svg 404 Not Found (\d+)ms/);
      expect(info.description).toBe(description);
      expect(info.meta).toStrictEqual({
        req: {
          data: undefined,
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/1.3.3' },
          method: 'get',
          requestStartedAt,
          timeout: 0,
          url: 'http://localhost:1337/uploads/non-existent.svg',
          xsrfCookieName: 'XSRF-TOKEN',
          xsrfHeaderName: 'X-XSRF-TOKEN',
        },
        res: {
          data: {
            data: null,
            error: { details: {}, message: 'Not Found', name: 'NotFoundError', status: 404 },
          },
          headers: {
            connection: 'close',
            'content-length': '94',
            'content-type': 'application/json; charset=utf-8',
            date: 'Mon, 06 Feb 2023 15:48:16 GMT',
          },
          responseTime: 100,
          status: 404,
          statusText: 'Not Found',
        },
      });
    });

    test('it should pass through other properties in the axios format', () => {
      const info = axiosLogFormat().transform(
        Object.assign(axiosError, {
          requestTraceId: 'test1234-request-id',
          timestamp: '2023-02-07 17:53:36.730',
        }),
        { meta: true }
      );

      expect(info.level).toBe(level);
      expect(info.message).toMatch(/GET http:\/\/localhost:1337\/uploads\/non-existent\.svg 404 Not Found (\d+)ms/);
      expect(info.requestTraceId).toBe('test1234-request-id');
      expect(info.timestamp).toBe('2023-02-07 17:53:36.730');
      expect(info.description).toBe(description);
      expect(info.meta).toStrictEqual({
        req: {
          data: undefined,
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/1.3.3' },
          method: 'get',
          requestStartedAt,
          timeout: 0,
          url: 'http://localhost:1337/uploads/non-existent.svg',
          xsrfCookieName: 'XSRF-TOKEN',
          xsrfHeaderName: 'X-XSRF-TOKEN',
        },
        res: {
          data: {
            data: null,
            error: { details: {}, message: 'Not Found', name: 'NotFoundError', status: 404 },
          },
          headers: {
            connection: 'close',
            'content-length': '94',
            'content-type': 'application/json; charset=utf-8',
            date: 'Mon, 06 Feb 2023 15:48:16 GMT',
          },
          responseTime: 100,
          status: 404,
          statusText: 'Not Found',
        },
      });
    });
  });

  describe('For Network Errors', () => {
    const level = 'error';

    test('it should add axios "ECONNREFUSED" error meta information the info object', () => {
      // Axios error in JSON format
      // 1. Arrange data for generating AxiosError
      const code = 'ECONNREFUSED';
      const errno = -61;
      const message = 'connect ECONNREFUSED 127.0.0.1:3333';
      const config = {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'axios/1.3.3',
        },
        method: 'get',
        url: 'http://localhost:3333',
        requestStartedAt,
      };
      const request = {
        method: 'GET',
        path: '/',
        host: 'localhost',
        protocol: 'http:',
      };

      const axiosError = Object.assign(new AxiosError(message, code, config, request), {
        level,
        errno,
        syscall: 'connect',
        hostname: 'localhost',
        address: '127.0.0.1',
        port: 3333,
      });

      // 2. Act
      const info = axiosLogFormat().transform(axiosError, { meta: true });

      // 3. Assert
      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe('Axios error');

      expect(info.meta).toStrictEqual({
        req: {
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/1.3.3' },
          method: 'get',
          requestStartedAt,
          url: 'http://localhost:3333',
        },
        res: {
          errno,
          code,
          syscall: 'connect',
          hostname: 'localhost',
          address: '127.0.0.1',
          port: 3333,
          status: null,
        },
      });
    });

    test('it should add axios "ENOTFOUND" error meta information the info object', () => {
      // 1. Arrange data for generating AxiosError
      const code = 'ENOTFOUND';
      const errno = -3008;
      const message = 'getaddrinfo ENOTFOUND non-existent-domain-for-sure.com';
      const config = {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'axios/1.3.3',
        },
        method: 'get',
        url: 'http://non-existent-domain-for-sure.com/',
        requestStartedAt,
        data: undefined,
      };
      const request = {
        method: 'GET',
        path: '/',
        host: 'non-existent-domain-for-sure.com',
        protocol: 'http:',
      };

      const axiosError = Object.assign(new AxiosError(message, code, config, request), {
        level,
        errno,
        syscall: 'getaddrinfo',
        hostname: 'non-existent-domain-for-sure.com',
        address: '1.2.3.4',
        port: 80,
        status: null,
      });

      // 2. Act
      const info = axiosLogFormat().transform(axiosError, { meta: true, stack: false });

      // 3. Assert
      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe('Axios error');
      expect(info.meta).toStrictEqual({
        req: {
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/1.3.3' },
          method: 'get',
          requestStartedAt,
          url: 'http://non-existent-domain-for-sure.com/',
        },
        res: {
          code,
          errno,
          syscall: 'getaddrinfo',
          hostname: 'non-existent-domain-for-sure.com',
          address: '1.2.3.4',
          port: 80,
          status: null,
        },
      });
    });

    test('it should add axios "ENOTFOUND" error meta information with stack the info object', () => {
      // 1. Arrange data for generating AxiosError
      const code = 'ENOTFOUND';
      const errno = -3008;
      const message = 'getaddrinfo ENOTFOUND non-existent-domain-for-sure.com';
      const config = {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'axios/1.3.3',
        },
        method: 'get',
        url: 'http://non-existent-domain-for-sure.com/',
        requestStartedAt,
        data: undefined,
      };
      const request = {
        method: 'GET',
        path: '/',
        host: 'non-existent-domain-for-sure.com',
        protocol: 'http:',
      };

      const axiosError = Object.assign(new AxiosError(message, code, config, request), {
        level,
        errno,
        syscall: 'getaddrinfo',
        hostname: 'non-existent-domain-for-sure.com',
        address: '1.2.3.4',
        port: 80,
        status: null,
      });

      // 2. Act
      const info = axiosLogFormat().transform(axiosError, { meta: true, stack: true });

      // 3. Assert
      expect(info.level).toBe(level);
      expect(info.message).toBe(message);
      expect(info.description).toBe('Axios error');
      expect(info.meta).toStrictEqual({
        req: {
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/1.3.3' },
          method: 'get',
          requestStartedAt,
          url: 'http://non-existent-domain-for-sure.com/',
        },
        res: {
          errno,
          code,
          stack: expect.stringMatching(/Error: getaddrinfo ENOTFOUND non-existent-domain-for-sure.com/),
          syscall: 'getaddrinfo',
          hostname: 'non-existent-domain-for-sure.com',
          address: '1.2.3.4',
          port: 80,
          status: null,
        },
      });
    });
  });
});

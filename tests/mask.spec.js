const {
  MASK_DATA_SEVERITY_OPEN,
  MASK_DATA_SEVERITY_STRICT,
  MASK_DATA_SEVERITY_PARTIAL,
} = require('@infotorg/mask-data-severity-levels');
const maskLogFormat = require('../src/mask');
const { MaskDataOptions } = require('@coder.ua/mask-data');

describe('Tests "mask" Log format', () => {
  const level = 'info';

  test('it should be a function', () => {
    expect(typeof maskLogFormat === 'function').toBe(true);
  });

  test('it should return Format wrapper object', () => {
    expect(typeof maskLogFormat() === 'object').toBe(true);
  });

  describe('No masking cases', () => {
    test('it should return the same info object if "target" option is not set', () => {
      const info = maskLogFormat().transform({ level, message: 'Test' });

      expect(info).toStrictEqual({ level, message: 'Test' });
    });

    test('it should return the same info object if "target" property is not exist in info object', () => {
      const data = { level, message: 'Test' };
      const info = maskLogFormat().transform(data, { target: 'xyz' });

      expect(info).toStrictEqual(data);
    });

    test(`it should return the same info object if "severity" is "${MASK_DATA_SEVERITY_OPEN}"`, () => {
      const data = {
        level,
        message: 'Test',
        meta: { req: { url: 'htts://example.com' } },
      };
      const info = maskLogFormat().transform(data, {
        target: 'meta',
        severity: MASK_DATA_SEVERITY_OPEN,
      });

      expect(info).toStrictEqual(data);
    });
  });

  describe('Masking cases', () => {
    test('it should NOT mask white listed fields', () => {
      const data = {
        message: 'Test',
        meta: {
          req: {
            baseURL: 'http://localhost:1337',
            data: undefined,
            headers: {
              Accept: 'application/json, text/plain, */*',
            },
            method: 'post',
            requestStartedAt: 1675770391875,
            url: '/uploads/search_1bff605b0f.svg',
          },
          res: {
            headers: {
              connection: 'close',
              'content-length': '11',
              'content-type': 'application/json',
            },
            responseTime: 100,
            status: 200,
            statusText: 'OK',
            data: '<svg></svg>',
          },
        },
      };

      const info = maskLogFormat().transform(data, {
        target: 'meta',
        whiteList: [
          'req.baseURL',
          'req.url',
          'req.data',
          'req.headers.Accept',
          'res.data',
          'res.headers.content-type',
          'res.headers.connection',
          'res.statusText',
        ],
      });

      expect(info.meta).toStrictEqual({
        req: {
          baseURL: 'http://localhost:1337',
          data: undefined,
          headers: {
            Accept: 'application/json, text/plain, */*',
          },
          method: 'post',
          requestStartedAt: 1675770391875,
          url: '/uploads/search_1bff605b0f.svg',
        },
        res: {
          headers: {
            connection: 'close',
            'content-length': '11',
            'content-type': 'application/json',
          },
          responseTime: 100,
          status: 200,
          statusText: 'OK',
          data: '<svg></svg>',
        },
      });
    });

    test(`it should mask everything when white listed fields not passed for severity = "${MASK_DATA_SEVERITY_STRICT}"`, () => {
      const data = {
        message: 'Test',
        meta: {
          req: {
            url: 'http://localhost:1337/uploads/search_1bff605b0f.svg',
            data: undefined,
            headers: {
              Accept: 'application/json, text/plain, */*',
            },
            method: 'post',
            requestStartedAt: 1675770391875,
          },
          res: {
            headers: {
              connection: 'close',
              'content-length': '11',
              'content-type': 'application/json',
            },
            responseTime: 100,
            status: 200,
            statusText: 'OK',
            data: '<svg></svg>',
          },
        },
      };

      const info = maskLogFormat().transform(data, {
        target: 'meta',
        severity: MASK_DATA_SEVERITY_STRICT,
      });

      expect(info.meta).toStrictEqual({
        req: {
          url: '****************',
          data: '*********',
          headers: { Accept: '****************' },
          method: '****',
          requestStartedAt: '*************',
        },
        res: {
          data: '***********',
          headers: { connection: '*****', 'content-length': '**', 'content-type': '****************' },
          responseTime: '***',
          status: '***',
          statusText: '**',
        },
      });
    });

    test('it should mask properly with "whiteList" and mask configuration', () => {
      const data = {
        message: 'Test',
        meta: {
          req: {
            data: { sensitive: 'your sensitive data' },
            headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.25.0' },
            method: 'get',
            requestStartedAt: 1675770391875,
            url: 'http://non-existent-domain-for-sure.com/',
          },
          res: {
            errno: -3008,
            code: 'ENOTFOUND',
            stack: 'Error: getaddrinfo ENOTFOUND non-existent-domain-for-sure.com',
            syscall: 'getaddrinfo',
            hostname: 'non-existent-domain-for-sure.com',
            address: '1.2.3.4',
            port: 80,
            status: null,
          },
        },
      };

      const info = maskLogFormat().transform(data, {
        target: 'meta',
        severity: MASK_DATA_SEVERITY_PARTIAL,
        whiteList: [
          // Request white list
          'req.url',
          'req.method',
          'req.stack',
          'req.requestStartedAt',
          'req.headers.Accept',
          'req.headers.User-Agent',

          // Response white list
          'res.errno',
          'res.code',
          'res.stack',
          'res.hostname',
        ],
      });

      expect(info.meta).toStrictEqual({
        req: {
          data: { sensitive: 'yo***************ta' },
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.25.0' },
          method: 'get',
          requestStartedAt: 1675770391875,
          url: 'http://non-existent-domain-for-sure.com/',
        },
        res: {
          address: '1.***.4',
          code: 'ENOTFOUND',
          errno: -3008,
          hostname: 'non-existent-domain-for-sure.com',
          port: 80,
          stack: 'Error: getaddrinfo ENOTFOUND non-existent-domain-for-sure.com',
          status: null,
          syscall: 'ge*******fo',
        },
      });
    });

    test('it should mask properly with "whiteList" and passed "maskOptions" configuration object', () => {
      const data = {
        message: 'Test',
        meta: {
          req: {
            data: { sensitive: 'your sensitive data' },
            headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.25.0' },
            method: 'get',
            requestStartedAt: 1675770391875,
            url: 'http://non-existent-domain-for-sure.com/',
          },
          res: {
            errno: -3008,
            code: 'ENOTFOUND',
            stack: 'Error: getaddrinfo ENOTFOUND non-existent-domain-for-sure.com',
            syscall: 'getaddrinfo',
            hostname: 'non-existent-domain-for-sure.com',
            address: '1.2.3.4',
            port: 80,
            status: null,
          },
        },
      };

      const info = maskLogFormat().transform(data, {
        target: 'meta',
        severity: MASK_DATA_SEVERITY_PARTIAL,
        whiteList: [
          // Request white list
          'req.url',
          'req.method',
          'req.stack',
          'req.requestStartedAt',
          'req.headers.Accept',
          'req.headers.User-Agent',

          // Response white list
          'res.errno',
          'res.code',
          'res.stack',
        ],
        maskOptions: {
          maskWith: 'X',
          maskNull: true,
          unmaskedStartChars: 1,
          unmaskedEndChars: 1,
        },
      });

      expect(info.meta).toStrictEqual({
        req: {
          data: { sensitive: 'yXXXXXXXXXXXXXXXXXa' },
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.25.0' },
          method: 'get',
          requestStartedAt: 1675770391875,
          url: 'http://non-existent-domain-for-sure.com/',
        },
        res: {
          address: '1XXXXX4',
          code: 'ENOTFOUND',
          errno: -3008,
          hostname: 'nXXXXXXXXXXXXXXXXXXXXXXXXXXXXm',
          port: 80,
          stack: 'Error: getaddrinfo ENOTFOUND non-existent-domain-for-sure.com',
          status: 'nXXl',
          syscall: 'gXXXXXXXXXo',
        },
      });
    });

    test('it should mask properly when "maskOptions" configuration as MaskDataOptions instance', () => {
      const data = {
        message: 'Test',
        meta: {
          req: {
            data: { sensitive: 'your sensitive data' },
            headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.25.0' },
            method: 'get',
            requestStartedAt: 1675770391875,
            url: 'http://non-existent-domain-for-sure.com/',
          },
          res: {
            errno: -3008,
            code: 'ENOTFOUND',
            stack: 'Error: getaddrinfo ENOTFOUND non-existent-domain-for-sure.com',
            syscall: 'getaddrinfo',
            hostname: 'non-existent-domain-for-sure.com',
            address: '1.2.3.4',
            port: 80,
            status: null,
          },
        },
      };

      const info = maskLogFormat().transform(data, {
        target: 'meta',
        severity: MASK_DATA_SEVERITY_PARTIAL,
        whiteList: [
          // Request white list
          'req.url',
          'req.method',
          'req.stack',
          'req.requestStartedAt',
          'req.headers.Accept',
          'req.headers.User-Agent',

          // Response white list
          'res.errno',
          'res.code',
          'res.stack',
        ],
        maskOptions: new MaskDataOptions({
          maskWith: '~',
          maxMaskedChars: 12,
          maskNull: false,
          unmaskedStartChars: 1,
          unmaskedEndChars: 1,
        }),
      });

      expect(info.meta).toStrictEqual({
        req: {
          data: { sensitive: 'y~~~~~~~~~~a' },
          headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'axios/0.25.0' },
          method: 'get',
          requestStartedAt: 1675770391875,
          url: 'http://non-existent-domain-for-sure.com/',
        },
        res: {
          address: '1~~~~~4',
          code: 'ENOTFOUND',
          errno: -3008,
          hostname: 'n~~~~~~~~~~m',
          port: '80',
          stack: 'Error: getaddrinfo ENOTFOUND non-existent-domain-for-sure.com',
          status: null,
          syscall: 'g~~~~~~~~~o',
        },
      });
    });

    test('it should completely mask fields in "fullyMaskedFields" list', () => {
      const data = {
        message: 'Test',
        meta: {
          req: {
            url: '/api/login',
            method: 'post',
            data: { name: 'John', password: 'super-secret-passwd' },
            headers: {
              common: { Accept: 'application/json, text/plain, */*' },
              'Content-Type': 'application/json',
              'User-Agent': 'axios/1.3.3',
              'Content-Length': 49,
              requestStartedAt: 1676736693452,
            },
            baseURL: 'https://example.com',
            xsrfCookieName: 'XSRF-TOKEN',
            xsrfHeaderName: 'X-XSRF-TOKEN',
            requestStartedAt: 1676736693452,
          },
          res: {
            status: 200,
            statusText: 'OK',
          },
        },
      };

      const info = maskLogFormat().transform(data, {
        target: 'meta',
        severity: MASK_DATA_SEVERITY_PARTIAL,
        whiteList: [
          // Request white list
          'req.url',
          'req.method',
          'req.requestStartedAt',
          'req.headers.Accept',
          'req.headers.User-Agent',
          'req.data.password',

          // Response white list
          'res.status',
          'res.statusText',
        ],
        fullyMaskedFields: ['req.data.password'],
      });

      expect(info.meta).toStrictEqual({
        req: {
          baseURL: 'ht***************om',
          data: { name: 'John', password: '*******************' },
          headers: {
            'Content-Length': 49,
            'Content-Type': 'ap************on',
            'User-Agent': 'axios/1.3.3',
            common: { Accept: 'ap**************************/*' },
            requestStartedAt: 1676736693452,
          },
          method: 'post',
          requestStartedAt: 1676736693452,
          url: '/api/login',
          xsrfCookieName: 'XS******EN',
          xsrfHeaderName: 'X-********EN',
        },
        res: { status: 200, statusText: 'OK' },
      });
    });
  });
});

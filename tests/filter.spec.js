const filterLogFormat = require('../src/filter');

describe('Tests "filter" Log format', () => {
  const level = 'info';

  test('it should be a function', () => {
    expect(typeof filterLogFormat === 'function').toBe(true);
  });

  test('it should return Format wrapper object', () => {
    expect(typeof filterLogFormat() === 'object').toBe(true);
  });

  test('it should return the same info object if "target" option is not set', () => {
    const info = filterLogFormat().transform({ level, message: 'Test' });

    expect(info).toStrictEqual({ level, message: 'Test' });
  });

  test('it should return the same info object if "target" property is not exist in the log entry', () => {
    const data = { level, message: 'Test' };
    const info = filterLogFormat().transform(data, { target: 'xyz' });

    expect(info).toStrictEqual(data);
  });

  test(`it should return the same info object if format is disabled"`, () => {
    const data = {
      level,
      message: 'Test',
      meta: { req: { url: 'https://example.com' } },
    };
    const info = filterLogFormat().transform(data, {
      enabled: false,
      target: 'meta',
      blackList: ['req.url'],
    });

    expect(info).toStrictEqual(data);
  });

  test(`it should return the same info object if "blackList" option is empty"`, () => {
    const data = {
      level,
      message: 'Test',
      meta: { req: { url: 'https://example.com' } },
    };
    const info = filterLogFormat().transform(data, {
      target: 'meta',
      blackList: [],
    });

    expect(info).toStrictEqual(data);
  });

  test.each([
    {
      target: 'meta',
      blackList: [
        'req.body.sensitive',
        'req.headers.common',
        'req.headers.delete',
        'req.headers.get',
        'req.headers.head',
        'req.headers.post',
        'req.headers.put',
        'req.headers.patch',
      ],
    },
    {
      target: 'meta.req',
      blackList: [
        'body.sensitive',
        'headers.common',
        'headers.delete',
        'headers.get',
        'headers.head',
        'headers.post',
        'headers.put',
        'headers.patch',
      ],
    },
  ])(
    'it should exclude fields which are pointed in the "blackList" option for a target: %p',
    ({ target, blackList }) => {
      const data = {
        message: 'Test',
        meta: {
          req: {
            url: 'https://example.com',
            method: 'post',
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
            body: {
              sensitive: 'sensitive data',
              username: 'Test User',
            },
            requestStartedAt: 1675770391875,
          },
        },
      };

      const info = filterLogFormat().transform(data, {
        target,
        blackList,
      });

      expect(info.meta).toStrictEqual({
        req: {
          url: 'https://example.com',
          method: 'post',
          headers: {
            'X-Session': '1621448702.23937#Y8dbR/s1Wi3Wep830IUp8IoZDzz',
            'Content-type': 'application/json',
          },
          body: {
            username: 'Test User',
          },
          requestStartedAt: 1675770391875,
        },
      });
    }
  );
});

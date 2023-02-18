const requestId = require('../src/request-id');

describe('Tests requestId Log format', () => {
  test('it should be a function', () => {
    expect(typeof requestId === 'function').toBe(true);
  });

  test('it should return Format wrapper object', () => {
    expect(typeof requestId() === 'object').toBe(true);
  });

  test('it should add the "requestId" in the info object when it is specified in opts as a function', () => {
    const info = requestId().transform(
      { message: 'Some message' },
      { generateRequestIdFn: () => '123456-test-request-id' }
    );

    expect(info).toStrictEqual({
      message: 'Some message',
      requestId: '123456-test-request-id',
    });
  });

  test('it should use "requestId" from the info object when it is specified', () => {
    const info = requestId().transform(
      { message: 'Some message', requestId: 'request-id-from-info' },
      { generateRequestIdFn: () => '123456-test-request-id' }
    );

    expect(info).toStrictEqual({
      message: 'Some message',
      requestId: 'request-id-from-info',
    });
  });

  test.each([null, undefined, true, false, '', '123456-test-request-id', 0, 1, [], {}])(
    'it should NOT add the "requestId" in the info object when it is not a valid generate function',
    (input) => {
      const info = requestId().transform({ message: 'Some message' }, { generateRequestIdFn: input });

      expect(info).toStrictEqual({
        message: 'Some message',
      });
    }
  );
});

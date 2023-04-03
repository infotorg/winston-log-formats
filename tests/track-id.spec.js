const trackId = require('../src/track-id');

describe('Tests trackId Log format', () => {
  test('it should be a function', () => {
    expect(typeof trackId === 'function').toBe(true);
  });

  test('it should return Format wrapper object', () => {
    expect(typeof trackId() === 'object').toBe(true);
  });

  describe('trackId as opts', () => {
    test('it should add the "trackId" in the info object when it is a value', () => {
      const info = trackId().transform({ message: 'Some message' }, { trackId: '123456-test-track-id' });

      expect(info).toStrictEqual({
        message: 'Some message',
        trackId: '123456-test-track-id',
      });
    });

    test('it should add the "trackId" in the info object when it is a function', () => {
      const info = trackId().transform({ message: 'Some message' }, { trackId: () => '123456-test-track-id' });

      expect(info).toStrictEqual({
        message: 'Some message',
        trackId: '123456-test-track-id',
      });
    });
  });

  describe('trackId in info object', () => {
    test('it should use "trackId" from the info object when it is specified as a value', () => {
      const info = trackId().transform(
        { message: 'Some message', trackId: 'track-id-from-info' },
        { trackId: () => '123456-test-track-id' }
      );

      expect(info).toStrictEqual({
        message: 'Some message',
        trackId: 'track-id-from-info',
      });
    });

    test('it should use "trackId" from the info object when it is specified as a function', () => {
      const info = trackId().transform(
        { message: 'Some message', trackId: () => 'track-id-from-info-fn' },
        { trackId: () => '123456-test-track-id' }
      );

      expect(info).toStrictEqual({
        message: 'Some message',
        trackId: 'track-id-from-info-fn',
      });
    });

    test.each([null, undefined, false, '', 0])(
      'it should NOT add the "trackId" in the info object when it is falsy: %p',
      (input) => {
        const info = trackId().transform({ message: 'Some message' }, { trackId: input });

        expect(info).toStrictEqual({
          message: 'Some message',
        });
      }
    );
  });
});

const trackId = require('../src/track-id');

describe('Tests trackId Log format', () => {
  test('it should be a function', () => {
    expect(typeof trackId === 'function').toBe(true);
  });

  test('it should return Format wrapper object', () => {
    expect(typeof trackId() === 'object').toBe(true);
  });

  test('it should use a custom name for "trackId" in the info object', () => {
    const info = trackId().transform(
      { message: 'Some message' },
      { trackId: '123456-test-track-id', key: 'customTrackId' }
    );

    expect(info).toStrictEqual({
      message: 'Some message',
      customTrackId: '123456-test-track-id',
    });
  });

  test('it should NOT add "trackId" when the format is disabled in opts', () => {
    const info = trackId().transform({ message: 'Some message' }, { trackId: '123456-test-track-id', enabled: false });

    expect(info).toStrictEqual({
      message: 'Some message',
    });
  });

  describe('trackId as opts', () => {
    test('it should add the "trackId" in the info object when it is a value', () => {
      const info = trackId().transform({ message: 'Some message' }, { trackId: '123456-test-track-id' });

      expect(info).toStrictEqual({
        message: 'Some message',
        trackId: '123456-test-track-id',
      });
    });

    test('"trackId" function should have access to the "info" object', () => {
      const trackIdFn = (prefix, suffix, info) => `${prefix}-${info.label}:123456-test-track-id-${suffix}`;

      const info = trackId().transform(
        { label: 'node1', message: 'Some message' },
        { trackId: trackIdFn.bind(null, 'PREFIX', 'SUFFIX') }
      );

      expect(info).toStrictEqual({
        label: 'node1',
        message: 'Some message',
        trackId: 'PREFIX-node1:123456-test-track-id-SUFFIX',
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

    test('"trackId" function should have access to the "info" object', () => {
      const trackIdFn = (prefix, suffix, info) => `${prefix}-${info.label}:123456-test-track-id-${suffix}`;

      const info = trackId().transform({
        label: 'node2',
        message: 'Some message',
        trackId: trackIdFn.bind(null, 'PREFIX', 'SUFFIX'),
      });

      expect(info).toStrictEqual({
        label: 'node2',
        message: 'Some message',
        trackId: 'PREFIX-node2:123456-test-track-id-SUFFIX',
      });
    });

    test.each([null, undefined, false, '', 0])(
      'it should NOT add the "trackId" in the info object when it is empty or not a string and not a number: %p',
      (input) => {
        const info = trackId().transform({ message: 'Some message' }, { trackId: input });

        expect(info).toStrictEqual({
          message: 'Some message',
        });
      }
    );
  });
});

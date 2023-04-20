const formats = require('../src/main');

describe('Test formats exports', () => {
  const exportedFormats = Object.keys(formats);

  test.each(exportedFormats)('format "%s" should be a Function', (format) => {
    expect(typeof formats[format]).toBe('function');
  });

  test('it should export all formats', () => {
    const expectedFormats = ['axios', 'description', 'filter', 'mask', 'trackId'];

    expect(exportedFormats).toEqual(expectedFormats);
  });
});

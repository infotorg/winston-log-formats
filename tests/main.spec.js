const formats = require('../src/main');

describe('Test formats exports', () => {
  test.each(Object.keys(formats))('format "%s" should be a Function', (format) => {
    expect(typeof formats[format]).toBe('function');
  });
});

const { isObject } = require('../../src/utils/is-object');

describe('Tests for the isObject helper', () => {
  test.each([
    { value: { param: 'value' }, expected: true },
    /* eslint-disable-next-line no-new-object */
    { value: new Object(), expected: true },
    { value: new Function(), expected: false },
    { value: () => {}, expected: false },
    { value: 'Some string', expected: false },
    { value: ['a', 'b', 'c'], expected: false },
    { value: new Array(3), expected: false },
    { value: new Set([1, 2, 4]), expected: false },
    { value: new Date(), expected: false },
    { value: undefined, expected: false },
    { value: null, expected: false },
  ])('it should detect only object created using object literal "{}" or "new Object()"', ({ value, expected }) => {
    expect(isObject(value)).toBe(expected);
  });
});

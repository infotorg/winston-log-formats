const { parseFields } = require('../../src/utils/parse-fields');

describe('Tests "parseFields" helper', () => {
  test.each([[], '', null, undefined, 0, false, true, () => {}, {}, Symbol('test')])(
    'it should return an empty Set for invalid fields: %p',
    (fields) => {
      expect(parseFields(fields).size).toBe(0);
    }
  );

  test('it should return only non empty trim string values for the fields', () => {
    // 1. Arrange
    const fields = ['', ' ', null, undefined, 0, false, true];

    // 2. Act
    const parsedFields = parseFields(fields);

    // 3. Assert
    expect(parsedFields.size).toBe(0);
  });

  test('it should return only unique and relevant normalized fields', () => {
    // 1. Arrange
    const fields = [
      '.',
      ' . ',
      '..',
      ' .. ',
      ' req.body ',
      ' req.body ',
      ' res.',
      '.req.body.password',
      '.req.body.password.',
      'res.headers',
    ];
    const expectedFields = ['req.body', 'res.headers'];

    // 2. Act
    const parsedFields = parseFields(fields);

    // 3. Assert
    expect(parsedFields.size).toBe(2);
    expect(Array.from(parsedFields)).toStrictEqual(expectedFields);
  });
});

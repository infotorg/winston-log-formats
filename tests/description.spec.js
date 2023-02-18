const description = require('../src/description');

describe('Tests description Log format', () => {
  test('it should be a function', () => {
    expect(typeof description === 'function').toBe(true);
  });

  test('it should return Format wrapper object', () => {
    expect(typeof description() === 'object').toBe(true);
  });

  test('it should NOT add a description if it is not passed as info or option', () => {
    const info = description().transform({ message: 'Some message' });

    expect(info).toStrictEqual({
      message: 'Some message',
    });
  });

  test('it should add a description from info object', () => {
    const info = description().transform({ message: 'Some message', description: 'Custom description' });

    expect(info).toStrictEqual({
      message: 'Some message',
      description: 'Custom description',
    });
  });

  test('it should NOT rewrite info.description withing opts one', () => {
    const info = description().transform(
      { message: 'Some message', description: 'Info description' },
      { description: 'Opts description' }
    );

    expect(info).toStrictEqual({ message: 'Some message', description: 'Info description' });
  });

  test('it should add a description from opts object if info does not contain it', () => {
    const info = description().transform({ message: 'Some message' }, { description: 'Custom description' });

    expect(info).toStrictEqual({
      message: 'Some message',
      description: 'Custom description',
    });
  });
});

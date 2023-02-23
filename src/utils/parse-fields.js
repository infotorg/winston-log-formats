/**
 * Parse fields from a string array:
 *  - remove empty values
 *  - remove non-string values
 *  - remove duplicates
 *  - trim values
 *  - remove values that start or end with a dot
 *
 * @param {string[]} fields
 * @return {Set<string>}
 */
const parseFields = (fields = []) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    return new Set();
  }

  return new Set(
    fields
      .filter((field) => typeof field === 'string')
      .map((field) => field.trim())
      .filter((field) => !field.startsWith('.') && !field.endsWith('.'))
      .filter((field) => field.length > 0)
  );
};

module.exports = { parseFields };

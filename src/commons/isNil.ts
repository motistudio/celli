/**
 * Returns if a certain value is undefined or null
 * @param {unknown} value - Any value
 * @returns {boolean}
 */
const isNil = (value: any): value is (undefined | null) => {
  return value === undefined || value === null || Number.isNaN(value)
}

export default isNil

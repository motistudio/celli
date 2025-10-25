/**
 * Returns if a certain value is complex (object, array, function) or primitive
 * @param {unknown} value - Any value
 * @returns {boolean}
 */
const isComplexType = (value: unknown): value is (object | Array<any> | Function) => {
  if (!value) {
    return false
  }
  const type = typeof value
  return type === 'object' || type === 'function'
}

export default isComplexType

/**
 * Gets a key from a function signature
 * @param {unknown[]} args - Function arguments
 * @returns {string}
 */
const getSignatureKey = (...args: unknown[]): string => {
  if (args.length === 0) {
    return ''
  }
  if (args.length === 1) {
    const type = typeof args[0]
    if (type === 'string' || type === 'number') {
      return String(args[0])
    }
  }
  return JSON.stringify(args)
}

export default getSignatureKey

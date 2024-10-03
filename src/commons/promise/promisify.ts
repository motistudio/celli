import isThentable from './isThentable'

const promisify = <T>(value: T | Promise<T>): Promise<T> => {
  return isThentable(value) ? value : Promise.resolve(value)
}

export default promisify

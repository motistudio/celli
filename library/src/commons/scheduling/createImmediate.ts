import type {Fn} from '../../types/commons.t'

const createImmediate = (callback: Fn, unref: boolean = true): NodeJS.Immediate => {
  const immediateRef = setImmediate(callback)
  if (unref && immediateRef.unref) {
    immediateRef.unref()
  }
  return immediateRef
}

export default createImmediate

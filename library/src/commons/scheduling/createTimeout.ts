import type {Fn} from '../../types/commons.t'

const createTimeout = (callback: Fn, timeout: number, unref: boolean = true): NodeJS.Timeout => {
  const timeoutRef = setTimeout(callback, timeout)
  if (unref && timeoutRef.unref) {
    timeoutRef.unref()
  }
  return timeoutRef
}

export default createTimeout

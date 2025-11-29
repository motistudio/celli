import type {Effect} from '../../../../types/effects.t'
import type {TtlOptions} from '../../../../types/commonEffects.t'

import createTimeout from '../../../../commons/scheduling/createTimeout'

const createTtlTimeout = (api: Parameters<Effect<any>>[0], timeout: number) => {
  return createTimeout(() => api.deleteSelf(), timeout, true)
}

const ttl = <T>({timeout, prolong = true}: TtlOptions): Effect<T> => {
  return (api) => {
    let timeoutRef: NodeJS.Timeout | undefined = createTtlTimeout(api, timeout)

    if (prolong) {
      api.onRead(() => {
        clearTimeout(timeoutRef)
        timeoutRef = createTtlTimeout(api, timeout)
      })
    }

    return () => {
      clearTimeout(timeoutRef)
      timeoutRef = undefined
    }
  }
}

export default ttl

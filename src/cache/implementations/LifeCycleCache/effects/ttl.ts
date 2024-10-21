import {Effect} from "../../../../types/effects.t"

type TtlOptions = {
  timeout: number
}

// TODO: Remove setSelf functionality
// TODO: Implement deleteSelf as events, and let the parent cache subscribe them - instead of having the opposite
const ttl = <T>({timeout}: TtlOptions): Effect<T> => {
  return (api) => {
    let timeoutRef: NodeJS.Timeout | undefined = setTimeout(() => api.deleteSelf(), timeout)

    api.onRead(() => {
      clearTimeout(timeoutRef)
      timeoutRef = setTimeout(() => api.deleteSelf(), timeout)
    })

    return () => {
      clearTimeout(timeoutRef)
      timeoutRef = undefined
    }
  }
}

export default ttl

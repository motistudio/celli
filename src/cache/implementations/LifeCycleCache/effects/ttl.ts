import {Effect} from "../../../../types/effects.t"

type TtlOptions = {
  timeout: number
}

const ttl = <T>({timeout}: TtlOptions): Effect<T> => {
  return (api) => {
    let timeoutRef: NodeJS.Timeout | undefined = setTimeout(() => api.deleteSelf(), timeout)

    api.onRead(() => {
      clearTimeout(timeoutRef)
      timeoutRef = setTimeout(() => api.deleteSelf(), timeout);
    })

    return () => {
      clearTimeout(timeoutRef)
      timeoutRef = undefined
    }
  }
}

export default ttl

import type {Effect, Cleanup, EffectApi} from '../../../types/effects.t'
import type {Observable as IObservable} from '../../../types/observables.t'

import isThentable from '../../../commons/promise/isThentable'

const createCleanup = <T>(api: EffectApi<T>, stream: IObservable<T>, effects: Effect<T>[]): Cleanup => {
  const unsubscribeCalls: Cleanup[] = []

  // insert API
  const onRead = (callback: Parameters<Parameters<Effect<T>>[0]['onRead']>[0]) => {
    const subscription = stream.subscribe(() => callback({get: api.getSelf}))
    unsubscribeCalls.push(subscription.unsubscribe)
  }

  const effectsCleanups = effects.reduce<Cleanup[]>((cleanups, effect) => {
    const cleanup = effect(api)
    if (typeof cleanup === 'function') {
      cleanups.push(cleanup)
    }
    return cleanups
  }, [])

  return () => {
    const cleanupPromises = effectsCleanups.reduce<Promise<void>[]>((promises, cleanup) => {
      const promise = cleanup()
      if (isThentable(promise)) {
        promises.push(promise)
      }
      return promises
    }, [])

    // Unsubscribing after calculating the promise in case anyone would think about subscribing to a value in the cleanup
    unsubscribeCalls.forEach((unsubscribe) => unsubscribe())

    if (cleanupPromises.length) {
      return Promise.all(cleanupPromises).then(() => undefined)
    }
  }
}

export default createCleanup

import type {AnyCacheType, CacheValue} from '../../types/cache.t'
import type {Effect} from '../../types/effects.t'

import EffectsCache from '../implementations/EffectsCache'

const effects = <C extends AnyCacheType<any, any>>(effects: Effect<CacheValue<C>>[]) => {
  return (cache: C) => {
    return new EffectsCache<C>(cache, effects)
  }
}

export default effects

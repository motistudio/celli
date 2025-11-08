import type {AnyCacheType} from '../../types/cache.t'
import LifeCycleCache from '../implementations/LifeCycleCache'

const lifeCycle = <C extends AnyCacheType<any, any>>() => {
  return (cache: C) => {
    return new LifeCycleCache<C>(cache)
  }
}

export default lifeCycle

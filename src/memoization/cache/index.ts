import type {Fn} from '../../types/commons.t'
import type {MemoizedFn} from '../../types/memoization.t'
import type {UniversalCacheOptions, UniversalCommonOptions, UniversalMemoOptions, UniversalCacheFromOptions, UniversalCacheViaOptions} from '../../types/functional.t'

import createCache from '../../cache/create'
import cacheWith from '../../memoization/cacheWith'
import memo from '../../memoization/memo'
import cacheVia from '../../memoization/cacheVia'
import getSignatureKey from '../../memoization/getSignatureKey'

const isCacheFromOptions = <F extends Fn>(options: UniversalCacheOptions<F>): options is (UniversalCommonOptions<F> & UniversalCacheFromOptions<F>) => {
  return ('from' in options) && !!options.from
}

const isCacheViaOptions = <F extends Fn>(options: UniversalCacheOptions<F>): options is (UniversalCommonOptions<F> & UniversalMemoOptions<F> & UniversalCacheViaOptions<F>) => {
  return ('via' in options) && !!options.via
}

function cache <F extends Fn>(fn: F, options: UniversalCommonOptions<F> & UniversalCacheViaOptions<F> & UniversalMemoOptions<F>): MemoizedFn<F>
function cache <F extends Fn>(fn: F, options: UniversalCommonOptions<F> & UniversalMemoOptions<F>): MemoizedFn<F>
function cache <F extends Fn>(fn: F, options: UniversalCommonOptions<F> & UniversalCacheFromOptions<F>): MemoizedFn<F>
function cache <F extends Fn>(fn: F, options: UniversalCacheOptions<F>): MemoizedFn<F> {
  if (isCacheFromOptions(options)) {
    return cacheWith(fn, {
      by: options.cacheBy,
      from: options.from
    })
  }
  const {cacheBy, ...rest} = options
  const cache = createCache<string, Awaited<ReturnType<Fn>>>(rest as Parameters<typeof createCache<string, Awaited<ReturnType<Fn>>>>[0])
  if (isCacheViaOptions(options)) {
    return cacheVia(fn, cacheBy || getSignatureKey, options.via, cache)
  }
  return memo(fn, cacheBy, cache)
}

export default cache

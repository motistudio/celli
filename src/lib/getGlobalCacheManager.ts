import once from '../commons/once'

import createCacheManager from '../createCacheManager'

const getGlobalCacheManager = once(() => createCacheManager())

export default getGlobalCacheManager

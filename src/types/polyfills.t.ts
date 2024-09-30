interface ArrayConstructor {
  // no unwrapping of promises
  fromAsync<T>(asyncIterable: AsyncIterable<T>): Promise<Array<T>>
  // unwrapping of promises
  fromAsync<T>(
    iterableOrArrayLike: Iterable<T> | ArrayLike<T>
  ): Promise<Array<Awaited<T>>>

  // no unwrapping of promises passed to callback
  // but callback promise is unwrapped
  fromAsync<T, U>(
    asyncIterable: AsyncIterable<T>,
    mapperFn: (value: T) => U,
    thisArg?: any
  ): Promise<Array<Awaited<U>>>
  // unwrapping on both sides
  fromAsync<T, U>(
    iterableOrArrayLike: Iterable<T> | ArrayLike<T>,
    mapperFn: (value: Awaited<T>) => U,
    thisArg?: any
  ): Promise<Array<Awaited<U>>>
}

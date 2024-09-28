import getAsyncIterator from '../../../src/commons/iterators/getAsyncIterator'
import isThentable from '../../../src/commons/promise/isThentable'
import reduce from '../../../src/commons/iterators/reduce'
import map from '../../../src/commons/iterators/map'
import asyncReduce from '../../../src/commons/iterators/asyncReduce'

describe('Iteratables utils', () => {
  describe('getAsyncIteratable', () => {
    test('Should turn an iterable into an async iterable', async () => {
      const set = new Set([1, 2, 3])
      const iterable = set.values()
      expect(iterable.next().value).toBe(1)
      const asyncIterable = getAsyncIterator(iterable)

      const next = asyncIterable.next()
      expect(isThentable(next)).toBe(true)
      await expect(next).resolves.toMatchObject(expect.objectContaining({value: 2}))
    })

    test('Should proxy an async iterable', async () => {
      const set = new Set([1, 2, 3])
      const iterable = getAsyncIterator(set.values())
      await expect(iterable.next()).resolves.toStrictEqual(expect.objectContaining({value: 1}))
      const asyncIterable = getAsyncIterator(iterable)

      const next = asyncIterable.next()
      expect(isThentable(next)).toBe(true)
      await expect(next).resolves.toStrictEqual(expect.objectContaining({value: 2}))
    })
  })

  describe('reduce()', () => {
    test('Should reduce an iterator into a value', () => {
      const list = [1, 2, 3]
      const set = new Set(list)
      const iterable = set.values()

      const reduceFn = (acc: number, num: number) => acc + num
      expect(reduce(iterable, reduceFn, 0)).toBe(list.reduce(reduceFn, 0))
    })

    test('Should verify the indices are correct', () => {
      const list = [0, 1, 2]
      const set = new Set(list)
      const iterable = set.values()
      expect(reduce(iterable, (isCorrect, item, index) => (isCorrect && (item === index)), true)).toBe(true)
    })
  })

  describe('map()', () => {
    test('Should map an iterator into an array', () => {
      const list = [1, 2, 3]
      const set = new Set(list)
      const iterable = set.values()

      const mapFn = (num: number) => num * 2
      expect(map(iterable, mapFn)).toMatchObject(list.map(mapFn))
    })
  })

  describe('asyncReduce()', () => {
    test('Should reduce a synchronous iterator into a value', async () => {
      const list = [1, 2, 3]
      const set = new Set(list)
      const iterable = set.values()

      const reduceFn = (acc: number, num: number) => acc + num
      await expect(asyncReduce(iterable, reduceFn, 0)).resolves.toBe(list.reduce(reduceFn, 0))
    })

    test('Should reduce a asynchronous iterator into a value', async () => {
      const list = [1, 2, 3]
      const set = new Set(list)
      const iterable = set.values()

      const reduceFn = (acc: number, num: number) => acc + num
      await expect(asyncReduce(iterable, (acc, item) => Promise.resolve(reduceFn(acc, item)), 0)).resolves.toBe(list.reduce(reduceFn, 0))
    })
  })
})

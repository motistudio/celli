export type Listener<T> = (value: T) => void

export type Observer<T> = {
  next: (value: T) => void,
  error: (e: Error) => void,
  complete: () => void
}

export type Observable<T> = {
  next: (value: T) => void
  error: (error: Error) => void,
  complete: () => void,
  subscribe: (callback: Listener<T> | Observer<T>) => {unsubscribe: () => void}
}

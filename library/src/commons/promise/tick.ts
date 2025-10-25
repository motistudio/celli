const tick = (): Promise<void> => {
  return new Promise((resolve) => {
    const ref = setImmediate(resolve)

    if (ref.unref) {
      ref.unref()
    }
  })
}

export default tick

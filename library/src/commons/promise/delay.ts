const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    const ref = setTimeout(() => resolve(), ms)

    if (ref.unref) {
      ref.unref()
    }
  })
}

export default delay

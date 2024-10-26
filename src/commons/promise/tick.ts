const tick = (): Promise<void> => {
  return new Promise((resolve) => {
    setImmediate(resolve)
  })
}

export default tick

import createImmediate from '../scheduling/createImmediate'

const tick = (): Promise<void> => {
  return new Promise((resolve) => {
    createImmediate(resolve, true)
  })
}

export default tick

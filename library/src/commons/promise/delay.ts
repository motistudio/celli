import createTimeout from '../scheduling/createTimeout'

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    createTimeout(resolve, ms, true)
  })
}

export default delay

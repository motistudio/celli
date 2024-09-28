const isNil = (value: any): value is (undefined | null) => {
  return value === undefined || value === null || Number.isNaN(value)
}

export default isNil

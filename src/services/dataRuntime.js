const defaultBaseUrl = import.meta.env?.BASE_URL || "/"

export class DataLoadError extends Error {
  constructor(relativePath, status) {
    super(`Failed to load ${relativePath}: ${status}`)
    this.name = "DataLoadError"
    this.relativePath = relativePath
    this.status = status
  }
}

export async function fetchJson(relativePath, options = {}) {
  const baseUrl = options.baseUrl || defaultBaseUrl
  const response = await fetch(baseUrl + relativePath)

  if (!response.ok) {
    throw new DataLoadError(relativePath, response.status)
  }

  return response.json()
}

export function createResourceCache(loadResource) {
  let hasCachedValue = false
  let cachedValue = undefined
  let pendingPromise = null

  return {
    async load() {
      if (hasCachedValue) return cachedValue
      if (pendingPromise) return pendingPromise

      pendingPromise = Promise.resolve()
        .then(loadResource)
        .then((value) => {
          cachedValue = value
          hasCachedValue = true
          return cachedValue
        })
        .finally(() => {
          pendingPromise = null
        })

      return pendingPromise
    },
    reset() {
      hasCachedValue = false
      cachedValue = undefined
      pendingPromise = null
    },
  }
}

export function createKeyedResourceCache(loadResource) {
  const cachedValues = new Map()
  const pendingPromises = new Map()

  return {
    async load(key) {
      if (cachedValues.has(key)) return cachedValues.get(key)
      if (pendingPromises.has(key)) return pendingPromises.get(key)

      const pendingPromise = Promise.resolve()
        .then(() => loadResource(key))
        .then((value) => {
          cachedValues.set(key, value)
          return value
        })
        .finally(() => {
          pendingPromises.delete(key)
        })

      pendingPromises.set(key, pendingPromise)
      return pendingPromise
    },
    reset() {
      cachedValues.clear()
      pendingPromises.clear()
    },
  }
}

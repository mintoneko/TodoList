/**
 * HTTP adapter from LiteDB Studio (@litedb/client).
 * Browser-safe: talks to LiteDB Server over REST.
 * Source: https://github.com/mintoneko/LitedbStudio
 */
export class HttpAdapter {
  constructor(options = {}) {
    let endpoint = options.endpoint || 'http://localhost:3000'
    if (endpoint.endsWith('/')) {
      endpoint = endpoint.slice(0, -1)
    }
    this.endpoint = endpoint
    this.apiKey = options.apiKey || null
    this.timeout = options.timeout || 15000
  }

  async request(path, options = {}) {
    const url = `${this.endpoint}${path}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      ...(options.headers || {}),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const json = await response.json().catch(() => ({}))
      if (!response.ok || json.success === false) {
        const errorMsg = json.error?.message || `HTTP ${response.status} ${response.statusText}`
        const err = new Error(errorMsg)
        err.status = response.status
        err.code = json.error?.code || `ERR_${response.status}`
        throw err
      }

      return json.data !== undefined ? json.data : json
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeout}ms`)
      }
      throw err
    }
  }

  async insert(collection, docOrDocs) {
    return this.request(`/api/collections/${collection}/insert`, {
      method: 'POST',
      body: Array.isArray(docOrDocs) ? { docs: docOrDocs } : { doc: docOrDocs },
    })
  }

  async findById(collection, id) {
    return this.request(`/api/collections/${collection}/${id}`, {
      method: 'GET',
    })
  }

  async query(collection, options = {}) {
    return this.request(`/api/collections/${collection}/query`, {
      method: 'POST',
      body: options,
    })
  }

  async count(collection, filter = {}) {
    const res = await this.request(`/api/collections/${collection}/count`, {
      method: 'POST',
      body: { filter },
    })
    return res.count
  }

  async updateById(collection, id, patch) {
    return this.request(`/api/collections/${collection}/${id}`, {
      method: 'PUT',
      body: patch,
    })
  }

  async updateMany(collection, filter, patch) {
    const res = await this.request(`/api/collections/${collection}`, {
      method: 'PUT',
      body: { filter, patch },
    })
    return res.updatedCount
  }

  async deleteById(collection, id) {
    await this.request(`/api/collections/${collection}/${id}`, {
      method: 'DELETE',
    })
    return true
  }

  async deleteMany(collection, filter = {}) {
    const res = await this.request(`/api/collections/${collection}`, {
      method: 'DELETE',
      body: { filter },
    })
    return res.deletedCount
  }

  async clear(collection) {
    await this.request(`/api/collections/${collection}/clear`, {
      method: 'POST',
    })
    return true
  }

  async createIndex(collection, field) {
    await this.request(`/api/collections/${collection}/index`, {
      method: 'POST',
      body: { field },
    })
    return true
  }

  async listCollections() {
    return this.request('/api/collections')
  }

  async createCollection(name) {
    return this.request('/api/collections', {
      method: 'POST',
      body: { name },
    })
  }

  async dropCollection(name) {
    await this.request(`/api/collections/${name}`, {
      method: 'DELETE',
    })
    return true
  }

  async rawSql(sql, params = []) {
    return this.request('/api/sql', {
      method: 'POST',
      body: { sql, params },
    })
  }

  async getStats() {
    return this.request('/api/system/stats')
  }

  async exportSnapshot() {
    return this.request('/api/system/export')
  }

  async importSnapshot(snapshot) {
    return this.request('/api/system/import', {
      method: 'POST',
      body: snapshot,
    })
  }

  async verifyAuth() {
    return this.request('/api/auth/verify')
  }

  async ping() {
    return this.request('/api/ping')
  }
}

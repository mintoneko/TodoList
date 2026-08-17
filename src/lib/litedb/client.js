/**
 * HTTP-only LiteDB client for browser apps.
 * Same collection API as @litedb/client, without the Node/SQLite embedded adapter.
 * Source: https://github.com/mintoneko/LitedbStudio
 */
import { HttpAdapter } from './http-adapter.js'
import { CollectionClient } from './collection-client.js'

export class LiteDB {
  /**
   * @param {object} [options]
   * @param {string} [options.endpoint]
   * @param {string} [options.apiKey]
   * @param {number} [options.timeout]
   */
  constructor(options = {}) {
    this.mode = 'http'
    this.adapter = new HttpAdapter(options)
    this._collections = new Map()
  }

  collection(name) {
    if (!this._collections.has(name)) {
      this._collections.set(name, new CollectionClient(name, this.adapter))
    }
    return this._collections.get(name)
  }

  async listCollections() {
    return this.adapter.listCollections()
  }

  async createCollection(name) {
    return this.adapter.createCollection(name)
  }

  async dropCollection(name) {
    this._collections.delete(name)
    return this.adapter.dropCollection(name)
  }

  async rawSql(sql, params = []) {
    return this.adapter.rawSql(sql, params)
  }

  async getStats() {
    return this.adapter.getStats()
  }

  async exportSnapshot() {
    return this.adapter.exportSnapshot()
  }

  async importSnapshot(snapshot) {
    return this.adapter.importSnapshot(snapshot)
  }

  async verifyAuth() {
    return this.adapter.verifyAuth()
  }

  async ping() {
    return this.adapter.ping()
  }

  close() {
    this._collections.clear()
  }
}

/**
 * Collection client from LiteDB Studio (@litedb/client).
 * Source: https://github.com/mintoneko/LitedbStudio
 */
export class CollectionClient {
  constructor(name, adapter) {
    this.name = name
    this.adapter = adapter
  }

  async insert(doc) {
    return this.adapter.insert(this.name, doc)
  }

  async insertMany(docs) {
    return this.adapter.insert(this.name, docs)
  }

  async findById(id, select = null) {
    if (this.adapter.findById) {
      const doc = await this.adapter.findById(this.name, id)
      if (doc && Array.isArray(select) && select.length > 0) {
        const filtered = {}
        for (const field of select) {
          if (field in doc) filtered[field] = doc[field]
        }
        return filtered
      }
      return doc
    }
    const docs = await this.find({ id }, { limit: 1, select })
    return docs.length > 0 ? docs[0] : null
  }

  async findOne(filter = {}, options = {}) {
    const docs = await this.find(filter, { ...options, limit: 1 })
    return docs.length > 0 ? docs[0] : null
  }

  async find(filter = {}, options = {}) {
    return this.adapter.query(this.name, {
      filter,
      ...options,
    })
  }

  async paginate(filter = {}, options = {}) {
    return this.adapter.query(this.name, {
      filter,
      page: options.page || 1,
      pageSize: options.pageSize || options.limit || 20,
      sort: options.sort,
      select: options.select,
    })
  }

  async count(filter = {}) {
    return this.adapter.count(this.name, filter)
  }

  async updateById(id, patch) {
    return this.adapter.updateById(this.name, id, patch)
  }

  async updateMany(filter, patch) {
    return this.adapter.updateMany(this.name, filter, patch)
  }

  async deleteById(id) {
    return this.adapter.deleteById(this.name, id)
  }

  async deleteMany(filter = {}) {
    return this.adapter.deleteMany(this.name, filter)
  }

  async clear() {
    return this.adapter.clear(this.name)
  }

  async createIndex(field) {
    return this.adapter.createIndex(this.name, field)
  }
}

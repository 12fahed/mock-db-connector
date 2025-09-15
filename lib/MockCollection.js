const QueryBuilder = require('./QueryBuilder');

/**
 * MockCollection - Represents a single collection (e.g., "users", "posts")
 * 
 * This class holds the data and exposes the public API methods for database operations.
 * It mimics the MongoDB Node.js driver collection API.
 */
class MockCollection {
  /**
   * Constructor
   * @param {string} name - Name of the collection
   */
  constructor(name) {
    this.name = name;
    this.documents = [];
  }

  /**
   * Insert a single document into the collection
   * @param {Object} document - Document to insert
   * @returns {Promise<Object>} - MongoDB-style response object
   */
  async insertOne(document) {
    if (!document || typeof document !== 'object') {
      throw new Error('Document must be an object');
    }

    // Create a copy of the document to avoid reference pollution
    const docToInsert = { ...document };

    // Generate a unique _id if not provided
    if (!docToInsert._id) {
      docToInsert._id = this._generateId();
    }

    this.documents.push(docToInsert);

    return {
      acknowledged: true,
      insertedId: docToInsert._id
    };
  }

  /**
   * Find documents matching a query
   * @param {Object} query - Query object (defaults to empty object)
   * @returns {Promise<Array>} - Array of matching documents
   */
  async find(query = {}) {
    const queryBuilder = new QueryBuilder(this.documents);
    const result = queryBuilder.match(query).execute();
    
    // Return a copy to prevent tests from accidentally modifying internal data
    return result.map(doc => ({ ...doc }));
  }

  /**
   * Find the first document matching a query
   * @param {Object} query - Query object (defaults to empty object)
   * @returns {Promise<Object|null>} - First matching document or null
   */
  async findOne(query = {}) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete the first document matching a query
   * @param {Object} query - Query object
   * @returns {Promise<Object>} - MongoDB-style response object
   */
  async deleteOne(query = {}) {
    const queryBuilder = new QueryBuilder(this.documents);
    const matchingDocs = queryBuilder.match(query).execute();
    
    if (matchingDocs.length === 0) {
      return {
        acknowledged: true,
        deletedCount: 0
      };
    }

    // Find the index of the first matching document in the original array
    const docToDelete = matchingDocs[0];
    const indexToDelete = this.documents.findIndex(doc => doc._id === docToDelete._id);
    
    if (indexToDelete !== -1) {
      this.documents.splice(indexToDelete, 1);
      return {
        acknowledged: true,
        deletedCount: 1
      };
    }

    return {
      acknowledged: true,
      deletedCount: 0
    };
  }

  /**
   * Update the first document matching a filter
   * @param {Object} filter - Filter to find document to update
   * @param {Object} update - Update operations
   * @param {Object} options - Update options (e.g., upsert)
   * @returns {Promise<Object>} - MongoDB-style response object
   */
  async updateOne(filter, update, options = {}) {
    if (!update || typeof update !== 'object') {
      throw new Error('Update must be an object');
    }

    const existingDoc = await this.findOne(filter);

    if (!existingDoc && options.upsert) {
      // Create new document by merging filter and update.$set
      const newDoc = { ...filter };
      if (update.$set) {
        Object.assign(newDoc, update.$set);
      }
      
      const insertResult = await this.insertOne(newDoc);
      return {
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedCount: 1,
        upsertedId: insertResult.insertedId
      };
    }

    if (!existingDoc) {
      return {
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0
      };
    }

    // Find the actual document in the array to modify in place
    const docIndex = this.documents.findIndex(doc => doc._id === existingDoc._id);
    if (docIndex === -1) {
      return {
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0
      };
    }

    const docToUpdate = this.documents[docIndex];
    let modified = false;

    // Apply $set operations
    if (update.$set) {
      Object.assign(docToUpdate, update.$set);
      modified = true;
    }

    // Apply $unset operations
    if (update.$unset) {
      for (const key in update.$unset) {
        if (key in docToUpdate) {
          delete docToUpdate[key];
          modified = true;
        }
      }
    }

    return {
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: modified ? 1 : 0
    };
  }

  /**
   * Clear all documents from the collection (helper for tests)
   */
  clear() {
    this.documents = [];
  }

  /**
   * Get the count of documents in the collection
   * @returns {number} - Number of documents
   */
  count() {
    return this.documents.length;
  }

  /**
   * Generate a simple unique ID
   * @returns {string} - Unique identifier
   * @private
   */
  _generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

module.exports = MockCollection;

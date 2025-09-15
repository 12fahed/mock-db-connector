const MockCollection = require('./MockCollection');

/**
 * MockDatabase - The main entry point and hub for managing multiple collections
 * 
 * This class manages multiple collections and provides the primary interface
 * that users will interact with. It mimics the MongoDB database interface.
 */
class MockDatabase {
  /**
   * Constructor
   */
  constructor() {
    this.collections = {};
  }

  /**
   * Get or create a collection by name
   * @param {string} name - Name of the collection
   * @returns {MockCollection} - The collection instance
   */
  collection(name) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Collection name must be a non-empty string');
    }

    // Create collection if it doesn't exist
    if (!this.collections[name]) {
      this.collections[name] = new MockCollection(name);
    }

    return this.collections[name];
  }

  /**
   * Drop (delete) a collection
   * @param {string} name - Name of the collection to drop
   * @returns {boolean} - True if collection was dropped, false if it didn't exist
   */
  dropCollection(name) {
    if (this.collections[name]) {
      delete this.collections[name];
      return true;
    }
    return false;
  }

  /**
   * Get a list of all collection names
   * @returns {Array<string>} - Array of collection names
   */
  listCollections() {
    return Object.keys(this.collections);
  }

  /**
   * Check if a collection exists
   * @param {string} name - Name of the collection
   * @returns {boolean} - True if collection exists
   */
  hasCollection(name) {
    return name in this.collections;
  }

  /**
   * Clear all collections (helper for tests)
   */
  clear() {
    this.collections = {};
  }

  /**
   * Clear all documents from all collections but keep the collections themselves
   */
  clearAllData() {
    for (const collectionName in this.collections) {
      this.collections[collectionName].clear();
    }
  }

  /**
   * Get statistics about the database
   * @returns {Object} - Database statistics
   */
  stats() {
    const stats = {
      collections: this.listCollections().length,
      totalDocuments: 0,
      collectionStats: {}
    };

    for (const [name, collection] of Object.entries(this.collections)) {
      const docCount = collection.count();
      stats.totalDocuments += docCount;
      stats.collectionStats[name] = {
        documents: docCount
      };
    }

    return stats;
  }
}

module.exports = MockDatabase;

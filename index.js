/**
 * mock-db-connector - Main entry point
 * 
 * A robust, in-memory mock database for Node.js unit testing that mimics the MongoDB driver API.
 * This package eliminates the need for complex mocking libraries by providing a realistic,
 * fake database that supports basic query operators and CRUD operations.
 * 
 * @author 12fahed
 * @license MIT
 */

const MockDatabase = require('./lib/MockDatabase');
const MockCollection = require('./lib/MockCollection');
const QueryBuilder = require('./lib/QueryBuilder');

module.exports = {
  MockDatabase,
  MockCollection,
  QueryBuilder
};

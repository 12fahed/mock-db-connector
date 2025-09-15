/**
 * QueryBuilder - The query engine for filtering documents based on MongoDB-like operators
 * 
 * This class is responsible for filtering an array of documents based on query objects
 * that use MongoDB-like operators such as $eq, $ne, $gt, $gte, $lt, $lte, $in, $regex
 */
class QueryBuilder {
  /**
   * Constructor
   * @param {Array} documents - Array of documents to perform operations on
   */
  constructor(documents) {
    this.documents = documents || [];
  }

  /**
   * Apply a query filter to the documents
   * @param {Object} query - Query object (e.g., { age: { $gte: 21 } })
   * @returns {QueryBuilder} - Returns this for method chaining
   */
  match(query) {
    if (!query || Object.keys(query).length === 0) {
      // Empty query matches all documents
      return this;
    }

    this.documents = this.documents.filter(doc => this._matchesQuery(doc, query));
    return this;
  }

  /**
   * Execute the query and return the filtered documents
   * @returns {Array} - Filtered array of documents
   */
  execute() {
    return this.documents;
  }

  /**
   * Check if a single document matches the query
   * @param {Object} doc - Document to check
   * @param {Object} query - Query object
   * @returns {boolean} - True if document matches query
   * @private
   */
  _matchesQuery(doc, query) {
    for (const key in query) {
      const queryValue = query[key];
      const docValue = doc[key];

      if (queryValue && typeof queryValue === 'object' && !Array.isArray(queryValue)) {
        // Handle operators like { age: { $gte: 21 } }
        for (const operator in queryValue) {
          if (!this._matchesOperator(docValue, operator, queryValue[operator])) {
            return false;
          }
        }
      } else {
        // Handle simple equality like { name: "Alice" }
        if (!this._matchesOperator(docValue, '$eq', queryValue)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if a field value matches a specific operator
   * @param {*} fieldValue - Value from the document field
   * @param {string} operator - MongoDB operator ($eq, $ne, etc.)
   * @param {*} value - Value to compare against
   * @returns {boolean} - True if the operator condition is met
   * @private
   */
  _matchesOperator(fieldValue, operator, value) {
    switch (operator) {
      case '$eq':
        return fieldValue === value;
      
      case '$ne':
        return fieldValue !== value;
      
      case '$gt':
        return fieldValue > value;
      
      case '$gte':
        return fieldValue >= value;
      
      case '$lt':
        return fieldValue < value;
      
      case '$lte':
        return fieldValue <= value;
      
      case '$in':
        return Array.isArray(value) && value.includes(fieldValue);
      
      case '$regex':
        if (typeof fieldValue !== 'string') {
          return false;
        }
        const regex = new RegExp(value);
        return regex.test(fieldValue);
      
      default:
        // Unknown operator, return false for safety
        return false;
    }
  }
}

module.exports = QueryBuilder;

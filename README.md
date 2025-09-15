# mock-db-connector

A robust, in-memory mock database for Node.js unit testing that mimics the MongoDB driver API. This package eliminates the need for complex mocking libraries by providing a realistic, fake database that supports basic query operators and CRUD operations.

## Features

- **Zero Dependencies** - Lightweight and secure
- **Familiar API** - Mimics MongoDB Node.js driver
- **Query Support** - Supports MongoDB-like operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $regex)
- **Thoroughly Tested** - Comprehensive Jest test suite
- **Fast & Reliable** - In-memory operations for lightning-fast tests
- **Isolated Collections** - No cross-collection data pollution

## Installation

```bash
npm install --save-dev mock-db-connector
```

## Quick Start

```javascript
const { MockDatabase } = require('mock-db-connector');

// Create a mock database
const db = new MockDatabase();

// Get a collection
const users = db.collection('users');

// Insert documents
await users.insertOne({ name: 'Alice', age: 30, city: 'New York' });
await users.insertOne({ name: 'Bob', age: 25, city: 'San Francisco' });

// Query documents
const results = await users.find({ age: { $gte: 25 } });
console.log(results); // Returns both Alice and Bob

// Find one document
const user = await users.findOne({ name: 'Alice' });
console.log(user); // Returns Alice's document

// Update documents
await users.updateOne(
  { name: 'Alice' }, 
  { $set: { age: 31 } }
);

// Delete documents
await users.deleteOne({ name: 'Bob' });
```

## Comparison: Traditional Mocks vs mock-db-connector

### Without mock-db-connector (Brittle Jest Mocks)
```javascript
// Fragile and hard to maintain
jest.mock('../my-db');
const db = require('../my-db');
db.getUser.mockResolvedValue({ name: 'Alice' });
db.updateUser.mockResolvedValue({ acknowledged: true });

// Test becomes tightly coupled to implementation
test('should update user age', async () => {
  await updateUserAge('alice-id', 31);
  expect(db.updateUser).toHaveBeenCalledWith(
    { _id: 'alice-id' }, 
    { $set: { age: 31 } }
  );
});
```

### With mock-db-connector (Realistic and Robust)
```javascript
// Natural and maintainable
const { MockDatabase } = require('mock-db-connector');
const db = new MockDatabase();

// Setup realistic test data
await db.collection('users').insertOne({ 
  _id: 'alice-id', 
  name: 'Alice', 
  age: 30 
});

// Test behavior, not implementation
test('should update user age', async () => {
  await updateUserAge('alice-id', 31);
  
  const user = await db.collection('users').findOne({ _id: 'alice-id' });
  expect(user.age).toBe(31);
});
```

## API Reference

### MockDatabase

#### `new MockDatabase()`
Creates a new mock database instance.

#### `collection(name)`
Gets or creates a collection by name.
- **Parameters:** `name` (string) - Collection name
- **Returns:** `MockCollection` instance

#### `dropCollection(name)`
Drops a collection.
- **Parameters:** `name` (string) - Collection name
- **Returns:** `boolean` - True if dropped, false if didn't exist

#### `listCollections()`
Lists all collection names.
- **Returns:** `Array<string>` - Collection names

#### `hasCollection(name)`
Checks if a collection exists.
- **Parameters:** `name` (string) - Collection name
- **Returns:** `boolean`

#### `clear()`
Removes all collections.

#### `clearAllData()`
Clears all documents from all collections but keeps collections.

#### `stats()`
Gets database statistics.
- **Returns:** `Object` - Database statistics

### MockCollection

#### `insertOne(document)`
Inserts a single document.
- **Parameters:** `document` (Object) - Document to insert
- **Returns:** `Promise<Object>` - `{ acknowledged: true, insertedId: string }`

#### `find(query)`
Finds documents matching a query.
- **Parameters:** `query` (Object) - Query object (optional, defaults to {})
- **Returns:** `Promise<Array>` - Array of matching documents

#### `findOne(query)`
Finds the first document matching a query.
- **Parameters:** `query` (Object) - Query object (optional, defaults to {})
- **Returns:** `Promise<Object|null>` - First matching document or null

#### `deleteOne(query)`
Deletes the first document matching a query.
- **Parameters:** `query` (Object) - Query object
- **Returns:** `Promise<Object>` - `{ acknowledged: true, deletedCount: number }`

#### `updateOne(filter, update, options)`
Updates the first document matching a filter.
- **Parameters:** 
  - `filter` (Object) - Filter to find document
  - `update` (Object) - Update operations
  - `options` (Object) - Options (e.g., `{ upsert: true }`)
- **Returns:** `Promise<Object>` - Update result object

#### `clear()`
Removes all documents from the collection.

#### `count()`
Gets the number of documents in the collection.
- **Returns:** `number`

## Supported Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equals | `{ age: { $eq: 30 } }` |
| `$ne` | Not equals | `{ age: { $ne: 30 } }` |
| `$gt` | Greater than | `{ age: { $gt: 25 } }` |
| `$gte` | Greater than or equal | `{ age: { $gte: 25 } }` |
| `$lt` | Less than | `{ age: { $lt: 30 } }` |
| `$lte` | Less than or equal | `{ age: { $lte: 30 } }` |
| `$in` | In array | `{ age: { $in: [25, 30, 35] } }` |
| `$regex` | Regular expression | `{ name: { $regex: '^A' } }` |

### Combining Operators

```javascript
// Multiple conditions on same field
await users.find({ 
  age: { $gte: 25, $lt: 40 } 
});

// Multiple fields
await users.find({ 
  age: { $gte: 25 }, 
  city: 'New York' 
});
```

## Update Operators

### `$set`
Sets field values:
```javascript
await users.updateOne(
  { name: 'Alice' },
  { $set: { age: 31, city: 'Boston' } }
);
```

### `$unset`
Removes fields:
```javascript
await users.updateOne(
  { name: 'Alice' },
  { $unset: { city: 1 } }
);
```

### Upsert
Insert if document doesn't exist:
```javascript
await users.updateOne(
  { name: 'Charlie' },
  { $set: { age: 28 } },
  { upsert: true }
);
```

## Testing Patterns

### Setup and Teardown
```javascript
describe('User Service', () => {
  let db;
  
  beforeEach(() => {
    db = new MockDatabase();
  });
  
  // Tests automatically get fresh database
});
```

### Seeding Test Data
```javascript
beforeEach(async () => {
  const users = db.collection('users');
  await users.insertOne({ name: 'Alice', age: 30 });
  await users.insertOne({ name: 'Bob', age: 25 });
});
```

### Testing Complex Queries
```javascript
test('should find users in age range', async () => {
  const users = db.collection('users');
  const results = await users.find({
    age: { $gte: 25, $lte: 35 },
    status: 'active'
  });
  
  expect(results).toHaveLength(2);
});
```

### Testing Service Layer
```javascript
// user-service.js
class UserService {
  constructor(database) {
    this.db = database;
  }
  
  async createUser(userData) {
    return this.db.collection('users').insertOne(userData);
  }
  
  async findActiveUsers() {
    return this.db.collection('users').find({ status: 'active' });
  }
}

// user-service.test.js
test('should create user', async () => {
  const db = new MockDatabase();
  const userService = new UserService(db);
  
  const result = await userService.createUser({ 
    name: 'Alice', 
    status: 'active' 
  });
  
  expect(result.acknowledged).toBe(true);
  
  const users = await userService.findActiveUsers();
  expect(users).toHaveLength(1);
  expect(users[0].name).toBe('Alice');
});
```

## Advanced Usage

### Collection Isolation
```javascript
const users = db.collection('users');
const posts = db.collection('posts');

// Operations on one collection don't affect the other
await users.insertOne({ name: 'Alice' });
await posts.insertOne({ title: 'Hello World' });

const userCount = users.count(); // 1
const postCount = posts.count(); // 1
```

### Database Statistics
```javascript
const stats = db.stats();
console.log(stats);
// {
//   collections: 2,
//   totalDocuments: 5,
//   collectionStats: {
//     users: { documents: 3 },
//     posts: { documents: 2 }
//   }
// }
```

## Best Practices

1. **Create fresh database per test** - Use `beforeEach` to ensure isolation
2. **Test behavior, not implementation** - Focus on outcomes rather than method calls
3. **Use realistic data** - Make test data similar to production data
4. **Test edge cases** - Empty collections, non-existent documents, etc.
5. **Combine with integration tests** - Use mock-db-connector for unit tests, real database for integration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.

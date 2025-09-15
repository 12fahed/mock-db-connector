const { MockDatabase } = require('../index');

describe('MockDatabase', () => {
  let db;

  beforeEach(() => {
    db = new MockDatabase();
  });

  describe('Database Management', () => {
    test('should create and retrieve collections', () => {
      const users = db.collection('users');
      const posts = db.collection('posts');

      expect(users).toBeDefined();
      expect(posts).toBeDefined();
      expect(users.name).toBe('users');
      expect(posts.name).toBe('posts');
    });

    test('should return same collection instance for same name', () => {
      const users1 = db.collection('users');
      const users2 = db.collection('users');

      expect(users1).toBe(users2);
    });

    test('should list collections', () => {
      db.collection('users');
      db.collection('posts');
      db.collection('comments');

      const collections = db.listCollections();
      expect(collections).toEqual(expect.arrayContaining(['users', 'posts', 'comments']));
      expect(collections).toHaveLength(3);
    });

    test('should drop collections', () => {
      db.collection('users');
      expect(db.hasCollection('users')).toBe(true);

      const dropped = db.dropCollection('users');
      expect(dropped).toBe(true);
      expect(db.hasCollection('users')).toBe(false);
    });

    test('should return false when dropping non-existent collection', () => {
      const dropped = db.dropCollection('nonexistent');
      expect(dropped).toBe(false);
    });

    test('should clear all collections', () => {
      db.collection('users');
      db.collection('posts');
      expect(db.listCollections()).toHaveLength(2);

      db.clear();
      expect(db.listCollections()).toHaveLength(0);
    });
  });

  describe('CRUD Operations', () => {
    let users;

    beforeEach(() => {
      users = db.collection('users');
    });

    describe('insertOne', () => {
      test('should insert document with auto-generated _id', async () => {
        const result = await users.insertOne({ name: 'Alice', age: 30 });

        expect(result.acknowledged).toBe(true);
        expect(result.insertedId).toBeDefined();
        expect(typeof result.insertedId).toBe('string');
      });

      test('should insert document with provided _id', async () => {
        const result = await users.insertOne({ _id: 'custom-id', name: 'Bob', age: 25 });

        expect(result.acknowledged).toBe(true);
        expect(result.insertedId).toBe('custom-id');
      });

      test('should create copy of document to avoid reference pollution', async () => {
        const originalDoc = { name: 'Charlie', age: 35 };
        await users.insertOne(originalDoc);

        originalDoc.name = 'Modified';
        const found = await users.findOne({ age: 35 });
        expect(found.name).toBe('Charlie');
      });
    });

    describe('find', () => {
      beforeEach(async () => {
        await users.insertOne({ name: 'Alice', age: 30, city: 'New York' });
        await users.insertOne({ name: 'Bob', age: 25, city: 'San Francisco' });
        await users.insertOne({ name: 'Charlie', age: 35, city: 'New York' });
      });

      test('should find all documents with empty query', async () => {
        const results = await users.find();
        expect(results).toHaveLength(3);
      });

      test('should find documents by exact match', async () => {
        const results = await users.find({ city: 'New York' });
        expect(results).toHaveLength(2);
        expect(results.every(doc => doc.city === 'New York')).toBe(true);
      });

      test('should return empty array when no matches', async () => {
        const results = await users.find({ city: 'Tokyo' });
        expect(results).toHaveLength(0);
      });

      test('should return copies to prevent modification', async () => {
        const results = await users.find();
        results[0].name = 'Modified';

        const freshResults = await users.find();
        expect(freshResults[0].name).not.toBe('Modified');
      });
    });

    describe('findOne', () => {
      beforeEach(async () => {
        await users.insertOne({ name: 'Alice', age: 30 });
        await users.insertOne({ name: 'Bob', age: 25 });
      });

      test('should find first matching document', async () => {
        const result = await users.findOne({ age: 30 });
        expect(result.name).toBe('Alice');
      });

      test('should return null when no match', async () => {
        const result = await users.findOne({ age: 40 });
        expect(result).toBe(null);
      });
    });

    describe('deleteOne', () => {
      beforeEach(async () => {
        await users.insertOne({ name: 'Alice', age: 30 });
        await users.insertOne({ name: 'Bob', age: 25 });
        await users.insertOne({ name: 'Charlie', age: 30 });
      });

      test('should delete first matching document', async () => {
        const result = await users.deleteOne({ age: 30 });
        expect(result.acknowledged).toBe(true);
        expect(result.deletedCount).toBe(1);

        const remaining = await users.find({ age: 30 });
        expect(remaining).toHaveLength(1);
      });

      test('should return 0 deletedCount when no match', async () => {
        const result = await users.deleteOne({ age: 40 });
        expect(result.acknowledged).toBe(true);
        expect(result.deletedCount).toBe(0);
      });
    });

    describe('updateOne', () => {
      beforeEach(async () => {
        await users.insertOne({ name: 'Alice', age: 30, city: 'New York' });
        await users.insertOne({ name: 'Bob', age: 25, city: 'San Francisco' });
      });

      test('should update document with $set', async () => {
        const result = await users.updateOne(
          { name: 'Alice' },
          { $set: { age: 31, city: 'Boston' } }
        );

        expect(result.acknowledged).toBe(true);
        expect(result.matchedCount).toBe(1);
        expect(result.modifiedCount).toBe(1);

        const updated = await users.findOne({ name: 'Alice' });
        expect(updated.age).toBe(31);
        expect(updated.city).toBe('Boston');
      });

      test('should update document with $unset', async () => {
        const result = await users.updateOne(
          { name: 'Alice' },
          { $unset: { city: 1 } }
        );

        expect(result.acknowledged).toBe(true);
        expect(result.matchedCount).toBe(1);
        expect(result.modifiedCount).toBe(1);

        const updated = await users.findOne({ name: 'Alice' });
        expect(updated.city).toBeUndefined();
      });

      test('should handle upsert when document not found', async () => {
        const result = await users.updateOne(
          { name: 'David' },
          { $set: { age: 28, city: 'Chicago' } },
          { upsert: true }
        );

        expect(result.acknowledged).toBe(true);
        expect(result.matchedCount).toBe(0);
        expect(result.modifiedCount).toBe(0);
        expect(result.upsertedCount).toBe(1);
        expect(result.upsertedId).toBeDefined();

        const inserted = await users.findOne({ name: 'David' });
        expect(inserted.age).toBe(28);
        expect(inserted.city).toBe('Chicago');
      });

      test('should return 0 counts when no match and no upsert', async () => {
        const result = await users.updateOne(
          { name: 'David' },
          { $set: { age: 28 } }
        );

        expect(result.acknowledged).toBe(true);
        expect(result.matchedCount).toBe(0);
        expect(result.modifiedCount).toBe(0);
      });
    });
  });

  describe('Query Operators', () => {
    let users;

    beforeEach(async () => {
      users = db.collection('users');
      await users.insertOne({ name: 'Alice', age: 30, score: 85.5, tags: ['admin', 'user'] });
      await users.insertOne({ name: 'Bob', age: 25, score: 92.0, tags: ['user'] });
      await users.insertOne({ name: 'Charlie', age: 35, score: 78.3, tags: ['admin'] });
      await users.insertOne({ name: 'David', age: 30, score: 88.7, tags: ['user', 'premium'] });
    });

    test('should support $eq operator', async () => {
      const results = await users.find({ age: { $eq: 30 } });
      expect(results).toHaveLength(2);
    });

    test('should support $ne operator', async () => {
      const results = await users.find({ age: { $ne: 30 } });
      expect(results).toHaveLength(2);
      expect(results.every(doc => doc.age !== 30)).toBe(true);
    });

    test('should support $gt operator', async () => {
      const results = await users.find({ age: { $gt: 30 } });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Charlie');
    });

    test('should support $gte operator', async () => {
      const results = await users.find({ age: { $gte: 30 } });
      expect(results).toHaveLength(3);
    });

    test('should support $lt operator', async () => {
      const results = await users.find({ age: { $lt: 30 } });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bob');
    });

    test('should support $lte operator', async () => {
      const results = await users.find({ age: { $lte: 30 } });
      expect(results).toHaveLength(3);
    });

    test('should support $in operator', async () => {
      const results = await users.find({ age: { $in: [25, 35] } });
      expect(results).toHaveLength(2);
      expect(results.map(doc => doc.name)).toEqual(expect.arrayContaining(['Bob', 'Charlie']));
    });

    test('should support $regex operator', async () => {
      const results = await users.find({ name: { $regex: '^A' } });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice');
    });

    test('should support combining multiple operators', async () => {
      const results = await users.find({
        age: { $gte: 25, $lte: 30 },
        score: { $gt: 85 }
      });
      expect(results).toHaveLength(3);
      expect(results.map(doc => doc.name)).toEqual(expect.arrayContaining(['Alice', 'Bob', 'David']));
    });
  });

  describe('Collection Isolation', () => {
    test('should maintain isolation between collections', async () => {
      const users = db.collection('users');
      const posts = db.collection('posts');

      await users.insertOne({ name: 'Alice' });
      await posts.insertOne({ title: 'Hello World' });

      const userResults = await users.find();
      const postResults = await posts.find();

      expect(userResults).toHaveLength(1);
      expect(postResults).toHaveLength(1);
      expect(userResults[0].name).toBe('Alice');
      expect(postResults[0].title).toBe('Hello World');
    });
  });

  describe('Edge Cases', () => {
    let users;

    beforeEach(() => {
      users = db.collection('users');
    });

    test('should handle empty collection operations', async () => {
      const findResult = await users.find();
      const findOneResult = await users.findOne();
      const deleteResult = await users.deleteOne({ name: 'Alice' });

      expect(findResult).toHaveLength(0);
      expect(findOneResult).toBe(null);
      expect(deleteResult.deletedCount).toBe(0);
    });

    test('should handle invalid collection names', () => {
      expect(() => db.collection('')).toThrow();
      expect(() => db.collection(null)).toThrow();
    });

    test('should handle invalid documents', async () => {
      await expect(users.insertOne(null)).rejects.toThrow();
      await expect(users.insertOne('string')).rejects.toThrow();
    });

    test('should handle invalid updates', async () => {
      await expect(users.updateOne({}, null)).rejects.toThrow();
      await expect(users.updateOne({}, 'string')).rejects.toThrow();
    });
  });

  describe('Database Statistics', () => {
    test('should provide database statistics', async () => {
      const users = db.collection('users');
      const posts = db.collection('posts');

      await users.insertOne({ name: 'Alice' });
      await users.insertOne({ name: 'Bob' });
      await posts.insertOne({ title: 'Post 1' });

      const stats = db.stats();
      expect(stats.collections).toBe(2);
      expect(stats.totalDocuments).toBe(3);
      expect(stats.collectionStats.users.documents).toBe(2);
      expect(stats.collectionStats.posts.documents).toBe(1);
    });
  });
});

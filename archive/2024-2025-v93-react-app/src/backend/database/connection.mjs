// backend/database/connection.mjs
import { FileStorageProvider } from './dbManager.mjs';
import logger from '../utils/logging/logger.mjs';

const connectionLogger = logger.child({ module: 'database-connection' });

// Collection storage providers
const collections = new Map();

/**
 * Get a database collection (simulated MongoDB-like interface)
 * @param {string} collectionName - Name of the collection
 * @returns {Object} Collection interface with MongoDB-like methods
 */
function getCollection(collectionName) {
  if (!collections.has(collectionName)) {
    const provider = new FileStorageProvider(collectionName);
    collections.set(collectionName, provider);
  }
  
  const provider = collections.get(collectionName);
  
  // Return MongoDB-like interface
  return {
    async find(query = {}) {
      await provider.initialize();
      const allData = await provider.getAll();
      
      // Simple query filtering
      if (Object.keys(query).length === 0) {
        return {
          toArray: () => Promise.resolve(allData),
          sort: (sortObj) => ({
            limit: (num) => ({
              toArray: () => Promise.resolve(allData.slice(0, num))
            }),
            toArray: () => Promise.resolve(allData.sort((a, b) => {
              for (const [field, order] of Object.entries(sortObj)) {
                if (a[field] < b[field]) return order === -1 ? 1 : -1;
                if (a[field] > b[field]) return order === -1 ? -1 : 1;
              }
              return 0;
            }))
          })
        };
      }
      
      const filtered = allData.filter(item => {
        return Object.entries(query).every(([key, value]) => {
          if (key === '_id' && value.$in) {
            return value.$in.some(id => id.toString() === item.id);
          }
          if (key === 'status') {
            return item[key] === value;
          }
          return item[key] === value;
        });
      });
      
      return {
        toArray: () => Promise.resolve(filtered),
        sort: (sortObj) => ({
          limit: (num) => ({
            toArray: () => Promise.resolve(filtered.slice(0, num))
          }),
          toArray: () => Promise.resolve(filtered.sort((a, b) => {
            for (const [field, order] of Object.entries(sortObj)) {
              if (a[field] < b[field]) return order === -1 ? 1 : -1;
              if (a[field] > b[field]) return order === -1 ? -1 : 1;
            }
            return 0;
          }))
        })
      };
    },
    
    async findOne(query) {
      await provider.initialize();
      const allData = await provider.getAll();
      return allData.find(item => {
        return Object.entries(query).every(([key, value]) => {
          if (key === '_id') {
            return item.id === value.toString();
          }
          return item[key] === value;
        });
      }) || null;
    },
    
    async insertOne(doc) {
      await provider.initialize();
      const result = await provider.create(doc);
      return {
        insertedId: { toString: () => result.id },
        ...result
      };
    },
    
    async updateOne(filter, update, options = {}) {
      await provider.initialize();
      
      // Find the document first
      const allData = await provider.getAll();
      const item = allData.find(item => {
        return Object.entries(filter).every(([key, value]) => {
          if (key === '_id') {
            return item.id === value.toString();
          }
          return item[key] === value;
        });
      });
      
      if (!item) {
        if (options.upsert) {
          // Create new document
          const newDoc = { ...update.$set };
          return await this.insertOne(newDoc);
        }
        return { matchedCount: 0, modifiedCount: 0 };
      }
      
      // Update the document
      const updatedDoc = { ...item, ...update.$set };
      await provider.update(item.id, updatedDoc);
      
      return { matchedCount: 1, modifiedCount: 1 };
    },
    
    async deleteOne(filter) {
      await provider.initialize();
      const allData = await provider.getAll();
      const item = allData.find(item => {
        return Object.entries(filter).every(([key, value]) => {
          if (key === '_id') {
            return item.id === value.toString();
          }
          return item[key] === value;
        });
      });
      
      if (item) {
        await provider.delete(item.id);
        return { deletedCount: 1 };
      }
      
      return { deletedCount: 0 };
    },
    
    async aggregate(pipeline) {
      await provider.initialize();
      const allData = await provider.getAll();
      
      // Simple aggregation pipeline support
      let result = allData;
      
      for (const stage of pipeline) {
        if (stage.$match) {
          result = result.filter(item => {
            return Object.entries(stage.$match).every(([key, value]) => {
              if (key === 'filterId') {
                return item[key] === value;
              }
              return item[key] === value;
            });
          });
        }
        
        if (stage.$group) {
          const grouped = {};
          result.forEach(item => {
            const groupKey = stage.$group._id;
            const key = groupKey === '$voteType' ? item.voteType : groupKey;
            
            if (!grouped[key]) {
              grouped[key] = { _id: key };
              Object.keys(stage.$group).forEach(field => {
                if (field !== '_id') {
                  grouped[key][field] = 0;
                }
              });
            }
            
            Object.entries(stage.$group).forEach(([field, operation]) => {
              if (field !== '_id' && operation.$sum === 1) {
                grouped[key][field]++;
              }
            });
          });
          
          result = Object.values(grouped);
        }
      }
      
      return {
        toArray: () => Promise.resolve(result)
      };
    }
  };
}

/**
 * Get database instance (simulated MongoDB-like interface)
 * @returns {Object} Database interface
 */
export function getDatabase() {
  return {
    collection: getCollection
  };
}

/**
 * Create ObjectId-like functionality for compatibility
 * @param {string} id - Optional ID string
 * @returns {Object} ObjectId-like object
 */
export function ObjectId(id = null) {
  const actualId = id || crypto.randomUUID();
  return {
    toString: () => actualId,
    valueOf: () => actualId,
    toHexString: () => actualId
  };
}

// Default export
export default {
  getDatabase,
  ObjectId
};

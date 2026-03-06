/**
 * Index Audit Script
 *
 * Analyzes all MongoDB collections and reports their indexes, sizes,
 * and document counts. Useful for identifying missing indexes or
 * redundant ones.
 *
 * Usage: npx tsx src/scripts/audit-indexes.ts
 */
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb/client';

async function auditIndexes(): Promise<void> {
  await connectMongoDB();

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Database connection not available');
    process.exit(1);
  }

  const collections = await db.listCollections().toArray();

  console.log('=== INDEX AUDIT REPORT ===\n');
  console.log(`Database: ${db.databaseName}`);
  console.log(`Collections: ${collections.length}`);
  console.log('');

  for (const collection of collections) {
    const coll = db.collection(collection.name);
    const indexes = await coll.indexes();

    // Use collStats command (compatible with newer MongoDB drivers)
    const statsResult = await db.command({ collStats: collection.name });

    console.log(`Collection: ${collection.name}`);
    console.log(`  Documents: ${statsResult.count ?? 0}`);
    console.log(`  Size: ${((statsResult.size ?? 0) / 1024).toFixed(1)} KB`);
    console.log(`  Avg Document Size: ${statsResult.count ? (statsResult.size / statsResult.count).toFixed(0) : 0} bytes`);
    console.log(`  Indexes (${indexes.length}):`);

    for (const index of indexes) {
      const indexName = index.name ?? '_id_';
      const indexSize = statsResult.indexSizes?.[indexName] ?? 0;
      const unique = index.unique ? ' [UNIQUE]' : '';
      const sparse = index.sparse ? ' [SPARSE]' : '';
      const text = Object.values(index.key).includes('text') ? ' [TEXT]' : '';
      console.log(
        `    - ${index.name}: ${JSON.stringify(index.key)}${unique}${sparse}${text} (${(indexSize / 1024).toFixed(1)} KB)`
      );
    }

    console.log('');
  }

  await disconnectMongoDB();
}

auditIndexes().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

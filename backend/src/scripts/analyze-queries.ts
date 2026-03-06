/**
 * Query Analysis Script
 *
 * Enables MongoDB profiler, waits for a configurable duration to collect
 * slow queries, then reports them sorted by execution time.
 *
 * Usage:
 *   npx tsx src/scripts/analyze-queries.ts              # Default: profile for 30s, threshold 50ms
 *   npx tsx src/scripts/analyze-queries.ts 60 100       # Profile for 60s, threshold 100ms
 */
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb/client';

const DEFAULT_DURATION_SECONDS = 30;
const DEFAULT_THRESHOLD_MS = 50;

async function analyzeQueries(): Promise<void> {
  const durationSeconds = parseInt(process.argv[2] || '', 10) || DEFAULT_DURATION_SECONDS;
  const thresholdMs = parseInt(process.argv[3] || '', 10) || DEFAULT_THRESHOLD_MS;

  await connectMongoDB();

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Database connection not available');
    process.exit(1);
  }

  console.log('=== QUERY ANALYSIS ===\n');
  console.log(`Profiling for ${durationSeconds} seconds...`);
  console.log(`Slow query threshold: ${thresholdMs}ms\n`);

  // Enable profiler level 1 (slow operations only)
  await db.command({ profile: 1, slowms: thresholdMs });

  // Wait for the profiling duration
  await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));

  // Disable profiler
  await db.command({ profile: 0 });

  // Read profiler results
  const profilerCollection = db.collection('system.profile');
  const slowQueries = await profilerCollection
    .find({})
    .sort({ millis: -1 })
    .limit(50)
    .toArray();

  if (slowQueries.length === 0) {
    console.log('No slow queries detected during the profiling window.');
    console.log('This is good — all queries completed under the threshold.\n');
  } else {
    console.log(`Found ${slowQueries.length} slow queries:\n`);

    for (const query of slowQueries) {
      console.log(`  Collection: ${query.ns}`);
      console.log(`  Operation: ${query.op}`);
      console.log(`  Duration: ${query.millis}ms`);

      if (query.command) {
        const cmd = JSON.stringify(query.command).slice(0, 300);
        console.log(`  Command: ${cmd}`);
      }

      if (query.planSummary) {
        console.log(`  Plan: ${query.planSummary}`);
      }

      if (query.nreturned !== undefined) {
        console.log(`  Docs returned: ${query.nreturned}`);
      }

      if (query.keysExamined !== undefined) {
        console.log(`  Keys examined: ${query.keysExamined}`);
      }

      if (query.docsExamined !== undefined) {
        console.log(`  Docs examined: ${query.docsExamined}`);
      }

      console.log('');
    }

    // Summary: highlight COLLSCAN operations (missing indexes)
    const collScans = slowQueries.filter(
      (q) => q.planSummary && q.planSummary.includes('COLLSCAN')
    );
    if (collScans.length > 0) {
      console.log('=== MISSING INDEX WARNINGS ===\n');
      console.log(`${collScans.length} queries performed full collection scans (COLLSCAN):`);
      for (const scan of collScans) {
        console.log(`  - ${scan.ns} (${scan.millis}ms): ${JSON.stringify(scan.command?.filter || scan.command).slice(0, 200)}`);
      }
      console.log('');
    }
  }

  await disconnectMongoDB();
}

analyzeQueries().catch((err) => {
  console.error('Analysis failed:', err);
  process.exit(1);
});

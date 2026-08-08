require('dotenv').config();

/**
 * Safety gate for the legacy destructive seed script.
 *
 * The underlying seed.js clears every application collection before inserting
 * demo data. It must never run accidentally in production.
 *
 * Required for development/staging:
 *   SEED_ALLOW_DESTRUCTIVE=true
 *   SEED_CONFIRM=WIPE_DATABASE
 */
const isProduction = process.env.NODE_ENV === 'production';
const allowDestructive = process.env.SEED_ALLOW_DESTRUCTIVE === 'true';
const confirmation = process.env.SEED_CONFIRM;

if (isProduction) {
  console.error('Refusing to run the destructive seed script in production.');
  process.exit(1);
}

if (!allowDestructive || confirmation !== 'WIPE_DATABASE') {
  console.error('Destructive seed blocked.');
  console.error('For development/staging, explicitly set:');
  console.error('  SEED_ALLOW_DESTRUCTIVE=true');
  console.error('  SEED_CONFIRM=WIPE_DATABASE');
  process.exit(1);
}

console.warn('WARNING: destructive seed enabled. Existing application data will be deleted.');
require('./seed');

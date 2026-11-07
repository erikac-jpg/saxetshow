/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  // No tests yet - the old suite tested the local SQLite layer, which has
  // been removed now that everything runs on Supabase. Drop this once
  // real tests exist for the Supabase-backed repositories.
  passWithNoTests: true,
};

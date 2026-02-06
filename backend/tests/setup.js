/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Suppress console logs during tests
if (process.env.LOG_LEVEL !== 'debug') {
  global.console.log = jest.fn();
  global.console.warn = jest.fn();
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASS = 'password';
process.env.DB_NAME = 'test_db';
process.env.JWT_SECRET = 'test_secret_key_12345';

// Test timeout
jest.setTimeout(10000);


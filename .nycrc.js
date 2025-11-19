// NYC configuration for E2E coverage collection and merging
// Uses shared patterns from coverage.config.js
const coverageConfig = require('./coverage.config.js');

module.exports = {
  // common coverage
  ...coverageConfig,
  all: true,
  reporter: ['lcov', 'text', 'json'],
  'report-dir': 'coverage/merged',
  'temp-dir': '.nyc_output',
  extension: ['.ts', '.tsx'],
  cache: false,
  sourceMap: true,
  instrument: true,
  excludeAfterRemap: true
};

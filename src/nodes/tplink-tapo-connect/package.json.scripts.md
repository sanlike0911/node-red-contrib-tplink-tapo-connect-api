# Test Scripts to Add to package.json

Add these scripts to your package.json file to run different types of tests:

```json
{
  "scripts": {
    // Existing scripts...
    
    // Test scripts
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:real-devices": "ENABLE_REAL_DEVICE_TESTS=true jest tests/integration",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Usage Examples:

```bash
# Run all tests (unit only by default)
npm test

# Run only unit tests
npm run test:unit

# Run integration tests with mocks
npm run test:integration

# Run integration tests with real devices (requires setup)
npm run test:real-devices

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests in CI environment
npm run test:ci

# Run specific test file
npm test -- tests/unit/devices/bulb-device.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should turn on"
```

## Environment Variables:

- `ENABLE_REAL_DEVICE_TESTS=true` - Enable integration tests with real devices
- `TAPO_TEST_USERNAME` - Test account username
- `TAPO_TEST_PASSWORD` - Test account password
- `MOCK_NETWORK_DELAYS=true` - Enable network delay simulation in mocks
// Global test setup
beforeAll(() => {
  // Mock all console methods to prevent logging during tests
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };

  // Set shorter timeouts for test environment
  process.env['TAPO_TEST_MODE'] = 'true';
  process.env['TAPO_CONNECTION_TIMEOUT'] = '2000'; // 2 seconds
});

afterEach(() => {
  // Clear all timers after each test to prevent leaks
  jest.clearAllTimers();
});

afterAll(async () => {
  // Clean up any pending operations
  jest.clearAllTimers();
  jest.useRealTimers();

  // Clean up environment variables
  delete process.env['TAPO_TEST_MODE'];
  delete process.env['TAPO_CONNECTION_TIMEOUT'];

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Wait a short time for any remaining async operations
  await new Promise(resolve => setTimeout(resolve, 100));
});
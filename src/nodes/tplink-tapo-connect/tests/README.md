# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the TP-Link Tapo Connect library.

## Test Organization

### Directory Structure

```
tests/
├── __mocks__/           # Mock implementations for testing
├── fixtures/            # Test data and mock responses
├── integration/         # Integration tests for real device interaction
├── unit/               # Unit tests for individual components
│   ├── core/          # Core functionality tests
│   ├── devices/       # Device-specific tests (by model)
│   └── *.test.ts      # Component unit tests
├── index.test.ts       # Main library entry point tests
├── setup.ts           # Test environment setup
└── test-config.ts     # Test configuration
```

### Unit Tests by Device Type

#### Smart Bulbs
- **L510/L520/L610**: Basic and tunable white bulbs
  - `l510-bulb.test.ts` - Dimmable white light only
  - `l520-bulb.test.ts` - Tunable white with color temperature
  - `l610-bulb.test.ts` - Similar to L510 (dimmable white)

- **L530/L535**: Full color bulbs with effects
  - `l530-bulb.test.ts` - Full color bulb with light effects
  - `l535-bulb.test.ts` - Enhanced version of L530

#### Light Strips
- **L900**: Basic color light strip
  - `l900-lightstrip.test.ts` - Color support without effects

- **L920/L930**: Advanced light strips with effects
  - `l920-l930-lightstrip.test.ts` - Full feature light strips with effects

#### Smart Plugs
- **P100/P105**: Basic plugs
  - `p100-p105-plug.test.ts` - Basic plug functionality (P100 without energy monitoring, P105 with potential energy monitoring)

- **P110/P115**: Energy monitoring plugs
  - `p110-p115-plug.test.ts` - Full energy monitoring capabilities

#### Multi-Outlet Power Strips
- **P300/P304**: Multi-outlet power strips
  - `p300-p304-powerstrip.test.ts` - Child device management (3 vs 4 outlets)

#### Smart Hub
- **H100**: Smart hub with alarm features
  - `h100-hub.test.ts` - Hub management, alarm control, ringtones

### Test Categories

#### Device Capabilities Testing
Each device test covers:
- **Instantiation**: Proper class creation and inheritance
- **Device Information**: Getting device details and status
- **Basic Controls**: Power on/off, toggle operations
- **Feature-Specific Controls**: Brightness, color, temperature, etc.
- **Capability Queries**: Feature support detection
- **Error Handling**: Connection issues, timeouts, invalid parameters
- **Input Validation**: Parameter range checking

#### Feature Coverage Matrix

| Feature                    | L510 | L520 | L530 | L535 | L900 | L920 | L930 | P100 | P105 | P110 | P115 | P300 | P304 | H100 |
|---------------------------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|
| Basic Power Control       | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   |
| Brightness Control        | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   |
| Color Control (HSV/RGB)   | ❌   | ❌   | ✅   | ✅   | ✅   | ✅   | ✅   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   |
| Color Temperature         | ❌   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   |
| Light Effects             | ❌   | ❌   | ✅   | ✅   | ❌   | ✅   | ✅   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   |
| Energy Monitoring         | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ⚠️   | ✅   | ✅   | ❌   | ❌   | ❌   |
| Child Device Management   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ✅   | ✅   | ✅   |
| Alarm/Ringtone Control    | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ❌   | ✅   |

✅ = Fully Supported, ⚠️ = Conditionally Supported, ❌ = Not Supported

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Specific Device Tests
```bash
# Test specific device type
npm test -- --testPathPattern="l530-bulb"
npm test -- --testPathPattern="p110-p115-plug"

# Test specific functionality
npm test -- --testNamePattern="color control"
npm test -- --testNamePattern="energy monitoring"
```

### Coverage Reports
```bash
npm run test:coverage
```

## Test Patterns and Conventions

### Mocking Strategy
- **Auth Modules**: All authentication modules are mocked to prevent real network calls
- **Device Responses**: Mock device responses are used to test parsing and error handling
- **Network Calls**: No real network requests are made during unit tests

### Test Structure
Each device test follows this pattern:
```typescript
describe('DeviceType Unit Tests', () => {
  describe('Class Instantiation', () => { /* ... */ });
  describe('Device Capabilities', () => { /* ... */ });
  describe('Basic Controls', () => { /* ... */ });
  describe('Feature-Specific Controls', () => { /* ... */ });
  describe('Error Handling', () => { /* ... */ });
});
```

### Assertion Patterns
- **Method Availability**: Verify all expected methods exist
- **Parameter Validation**: Test input validation and range checking
- **Request Generation**: Verify correct API request parameters
- **Response Parsing**: Test response handling and data transformation
- **Error Conditions**: Test various error scenarios

## Legacy Tests

Files with `-legacy.test.ts` suffix are older test implementations that may be:
- Less comprehensive than newer tests
- Using different testing patterns
- Candidates for removal after verification

## Contributing to Tests

When adding new device support:

1. **Create comprehensive unit tests** covering all device features
2. **Follow existing naming conventions** (`devicetype-model.test.ts`)
3. **Include capability matrix updates** in this README
4. **Test both success and error conditions**
5. **Mock all external dependencies**
6. **Validate input parameters and ranges**
7. **Test feature detection and capability queries**

### Test Coverage Goals
- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 95%
- **Statement Coverage**: > 90%

## Integration Testing

Integration tests in the `integration/` directory test:
- Real device connectivity
- Authentication protocols (KLAP, Secure Passthrough)
- End-to-end functionality
- Network error handling

**Note**: Integration tests require actual Tapo devices and should be run in a controlled environment.
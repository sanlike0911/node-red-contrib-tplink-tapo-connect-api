# TP-Link Tapo Smart Device Control Library

TypeScript/Node.js library for controlling TP-Link Tapo smart devices locally. This library provides a modern, type-safe interface for interacting with Tapo smart plugs, bulbs, and other devices without requiring cloud connectivity.

## Features

- **Local Control**: Direct device communication without cloud dependency
- **Multiple Authentication Protocols**: Supports both KLAP and Secure Passthrough protocols with automatic fallback
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Robust Error Handling**: Automatic retry logic and graceful error recovery
- **Device Auto-Discovery**: Automatic protocol detection and device capability discovery
- **Energy Monitoring**: Support for devices with energy monitoring capabilities

## Supported Devices

| Device Model | Type | Energy Monitoring | Color Support | Status |
|--------------|------|------------------|---------------|--------|
| P100 | Smart Plug | ❌ | ❌ | ✅ Supported |
| P105 | Smart Plug | ❌ | ❌ | ✅ Supported |
| P110 | Smart Plug with Energy Monitoring | ✅ | ❌ | ✅ Supported |
| P115 | Smart Plug with Energy Monitoring | ✅ | ❌ | ✅ Supported |
| P300 | Multi-Socket Power Strip | ❌ | ❌ | 🚧 Planned |
| P304 | Multi-Socket Power Strip | ❌ | ❌ | 🚧 Planned |
| L510 | Smart Bulb (Dimmable White) | ❌ | ❌ | ✅ Supported |
| L520 | Smart Bulb (Tunable White) | ❌ | 🔶 Color Temperature | ✅ Supported |
| L530 | Smart Bulb (Color) | ❌ | ✅ Full Color | ✅ Supported |
| L535 | Smart Bulb (Color) | ❌ | ✅ Full Color | 🚧 Planned |
| L610 | Smart Bulb (Dimmable White) | ❌ | ❌ | 🚧 Planned |
| L630 | Smart Bulb (Color) | ❌ | ✅ Full Color | 🚧 Planned |
| L900 | Light Strip | ❌ | ✅ Full Color | 🚧 Planned |
| L920 | Light Strip with Effects | ❌ | ✅ Full Color + Effects | 🚧 Planned |
| L930 | Light Strip with Effects | ❌ | ✅ Full Color + Effects | 🚧 Planned |

### Supported Features by Device

| Feature | P100/P105 | P110/P115 | L510 | L520 | L530 |
|---------|-----------|-----------|------|------|------|
| Device Info | ✅ | ✅ | ✅ | ✅ | ✅ |
| Power On/Off | ✅ | ✅ | ✅ | ✅ | ✅ |
| Device Usage | ✅ | ✅ | ✅ | ✅ | ✅ |
| Current Power | ❌ | ✅ | ❌ | ❌ | ❌ |
| Energy Data | ❌ | ✅ | ❌ | ❌ | ❌ |
| Energy Usage | ❌ | ✅ | ❌ | ❌ | ❌ |
| Brightness Control | ❌ | ❌ | ✅ | ✅ | ✅ |
| Color Control | ❌ | ❌ | ❌ | ❌ | ✅ |
| Color Temperature | ❌ | ❌ | ❌ | ✅ | ✅ |
| HSV Color Control | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lighting Effects | ❌ | ❌ | ❌ | ❌ | 🚧 Planned |

## Installation

```bash
npm install tplink-tapo-connect
```

## Quick Start

### Basic Smart Plug (P100/P105)

```typescript
import { TapoConnect, TapoCredentials } from 'tplink-tapo-connect';

const credentials: TapoCredentials = {
  username: 'your-tapo-username',
  password: 'your-tapo-password'
};

// Create P100 plug instance
const plug = await TapoConnect.createP100Plug('192.168.1.100', credentials);

// Connect and control
await plug.connect();

// Basic operations
await plug.turnOn();       // Turn on
await plug.turnOff();      // Turn off
await plug.toggle();       // Toggle state

// Get device information
const deviceInfo = await plug.getDeviceInfo();
console.log('Device:', deviceInfo.model, deviceInfo.device_on);

// Check device status
const isOn = await plug.isOn();
const onTime = await plug.getOnTime();

await plug.disconnect();
```

### Energy Monitoring Plug (P110/P115)

```typescript
import { TapoConnect } from 'tplink-tapo-connect';

// Create P110 plug instance with energy monitoring
const plug = await TapoConnect.createP110Plug('192.168.1.110', credentials);

await plug.connect();

// Basic control (same as P100/P105)
await plug.turnOn();

// Energy monitoring features
const currentPower = await plug.getCurrentPower();  // Current power in watts
const todayEnergy = await plug.getTodayEnergy();    // Today's energy in Wh
const energyUsage = await plug.getEnergyUsage();    // Detailed energy data

// Comprehensive usage information
const usageInfo = await plug.getUsageInfo();
console.log('Usage Info:', {
  currentPower: usageInfo.currentPower,
  todayEnergy: usageInfo.todayEnergy,
  todayRuntime: usageInfo.todayRuntime
});

await plug.disconnect();
```

## Advanced Usage

### Wrapper with Integrated Retry Support

```typescript
import { tplinkTapoConnectWrapper, RetryOptions } from 'tplink-tapo-connect';

const wrapper = tplinkTapoConnectWrapper.getInstance();

// Basic operation without retry (fast but less reliable)
await wrapper.setTapoTurnOn(email, password, ip);

// Operation with retry for reliability
const retryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  strategy: 'exponential'
};

const result = await wrapper.setTapoTurnOn(email, password, ip, retryOptions);
console.log('Operation completed successfully');

// Batch operations with retry
const batchResults = await wrapper.executeBatch([
  {
    operation: () => wrapper.getTapoDeviceInfo(email, password, ip, retryOptions),
    name: 'Get Device Info'
  },
  {
    operation: () => wrapper.setTapoTurnOn(email, password, ip, retryOptions),
    name: 'Turn On Device'
  }
]);
```

### Custom Retry Configuration

```typescript
import { tplinkTapoConnectWrapper, RetryOptions } from 'tplink-tapo-connect';

const wrapper = tplinkTapoConnectWrapper.getInstance();

// Custom retry configuration for different scenarios
const aggressiveRetry: RetryOptions = {
  maxAttempts: 5,
  baseDelay: 2000,
  strategy: 'linear',
  onRetry: (attempt, error, delay) => {
    console.log(`Retry ${attempt}: ${error.message} (waiting ${delay}ms)`);
  }
};

// Pre-configured retry options for common scenarios
const deviceControlRetry: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  strategy: 'exponential'
};

const energyMonitoringRetry: RetryOptions = {
  maxAttempts: 2,
  baseDelay: 500,
  strategy: 'linear'
};

// Apply retry options to operations
await wrapper.setTapoTurnOn(email, password, ip, deviceControlRetry);
const energyData = await wrapper.getTapoEnergyUsage(email, password, ip, energyMonitoringRetry);
```

### Batch Operations with Smart Delays

```typescript
import { tplinkTapoConnectWrapper, BatchOperation, RetryOptions } from 'tplink-tapo-connect';

const wrapper = tplinkTapoConnectWrapper.getInstance();
const retryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  strategy: 'exponential'
};

const operations: BatchOperation[] = [
  {
    operation: () => wrapper.getTapoDeviceInfo(email, password, ip, retryOptions),
    name: 'Get Status',
    delayAfter: 1000
  },
  {
    operation: () => wrapper.setTapoTurnOn(email, password, ip, retryOptions),
    name: 'Turn On',
    delayAfter: 3000  // Longer delay after control commands
  },
  {
    operation: () => wrapper.setTapoTurnOff(email, password, ip, retryOptions),
    name: 'Turn Off',
    delayAfter: 0
  }
];

const results = await wrapper.executeBatch(operations);
console.log(`${results.filter(r => r.success).length}/${results.length} operations successful`);
```

### KLAP -1012 Error Prevention

```typescript
import { tplinkTapoConnectWrapper, RetryOptions } from 'tplink-tapo-connect';

const wrapper = tplinkTapoConnectWrapper.getInstance();
const retryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  strategy: 'exponential'
};

// ❌ Bad - causes KLAP -1012 errors
await wrapper.setTapoTurnOn(email, password, ip);
await wrapper.setTapoTurnOff(email, password, ip);  // Will likely fail

// ✅ Good - proper delays prevent errors
await wrapper.setTapoTurnOn(email, password, ip);
await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
await wrapper.setTapoTurnOff(email, password, ip);

// ✅ Better - automatic retry handling with integrated retry support
await wrapper.setTapoTurnOn(email, password, ip, retryOptions);
await wrapper.setTapoTurnOff(email, password, ip, retryOptions); // Handles retries automatically

// ✅ Best - use batch operations for multiple commands
const operations = [
  {
    operation: () => wrapper.setTapoTurnOn(email, password, ip, retryOptions),
    name: 'Turn On',
    delayAfter: 3000
  },
  {
    operation: () => wrapper.setTapoTurnOff(email, password, ip, retryOptions),
    name: 'Turn Off'
  }
];
await wrapper.executeBatch(operations);
```

### Error Handling with Result Pattern

```typescript
// Using Result pattern for explicit error handling
const usageResult = await plug.getUsageInfoResult();
if (usageResult.success) {
  console.log('Usage data:', usageResult.data);
} else {
  console.log('Error:', usageResult.error.message);
}
```

### Graceful Feature Detection

```typescript
// Safely handle devices without energy monitoring
const currentPower = await plug.getCurrentPower({ throwOnUnsupported: false });
// Returns 0 for devices without energy monitoring instead of throwing

// Check feature support
const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
if (hasEnergyMonitoring) {
  const energyData = await plug.getEnergyUsage();
}
```

### Device Factory Methods

```typescript
import { TapoConnect } from 'tplink-tapo-connect';

// Create different device types
const p100 = await TapoConnect.createP100Plug(ip, credentials);  // Basic plug
const p105 = await TapoConnect.createP105Plug(ip, credentials);  // Basic plug
const p110 = await TapoConnect.createP110Plug(ip, credentials);  // Energy monitoring plug
const p115 = await TapoConnect.createP115Plug(ip, credentials);  // Energy monitoring plug
const l510 = await TapoConnect.createL510Bulb(ip, credentials);  // Dimmable bulb
const l520 = await TapoConnect.createL520Bulb(ip, credentials);  // Dimmable bulb
const l530 = await TapoConnect.createL530Bulb(ip, credentials);  // Color bulb
```

## API Reference

### Core Device Classes

#### TapoConnect Factory Methods

- `TapoConnect.createP100Plug(ip, credentials)` - Creates P100 plug instance
- `TapoConnect.createP105Plug(ip, credentials)` - Creates P105 plug instance  
- `TapoConnect.createP110Plug(ip, credentials)` - Creates P110 plug instance
- `TapoConnect.createP115Plug(ip, credentials)` - Creates P115 plug instance
- `TapoConnect.createL510Bulb(ip, credentials)` - Creates L510 bulb instance
- `TapoConnect.createL520Bulb(ip, credentials)` - Creates L520 bulb instance
- `TapoConnect.createL530Bulb(ip, credentials)` - Creates L530 bulb instance

### Wrapper Classes

#### Main Wrapper (Recommended)
- `tplinkTapoConnectWrapper` - Main wrapper with integrated retry support, batch operations, and device identifier support

### Retry and Batch Operations

#### RetryOptions Interface
- `maxAttempts` - Maximum number of retry attempts
- `baseDelay` - Base delay between retries (ms)
- `strategy` - Retry strategy ('linear' | 'exponential')
- `onRetry` - Optional callback for retry events

#### Batch Operations
- `executeBatch(operations)` - Execute multiple operations with smart delays
- `BatchOperation` interface for defining batch operations
- Automatic error handling and result aggregation

### Common Methods (All Devices)

- `connect()` - Establish connection to device
- `disconnect()` - Close connection
- `turnOn()` / `turnOff()` - Power control
- `toggle()` - Toggle power state
- `isOn()` - Check if device is on
- `getDeviceInfo()` - Get device information
- `getOnTime()` - Get device on time in seconds
- `isOverheated()` - Check overheating status
- `hasEnergyMonitoring()` - Check energy monitoring support

### Energy Monitoring Methods (P110/P115)

- `getCurrentPower(options?)` - Get current power consumption (watts)
- `getTodayEnergy(options?)` - Get today's energy consumption (Wh)
- `getEnergyUsage()` - Get detailed energy usage data
- `getEnergyData()` - Get comprehensive energy statistics
- `getUsageInfo(options?)` - Get combined usage information
- `getUsageInfoResult()` - Get usage info with Result pattern

## Development

### Scripts

```bash
# Build the project
npm run build

# Run examples
npm run example:plug    # Comprehensive plug example (all models)
npm run example:bulb    # Smart bulb example
npm run example:wrapper # Wrapper API example

# Run tests
npm test                # All tests

# Development
npm run build:watch        # Watch mode build
npm run lint              # Lint code
npm run lint:fix          # Fix linting issues
```

### Debugging in VS Code

This project includes comprehensive VS Code debug configurations:

#### Available Debug Configurations:
- **Debug Current File** - Debug any currently open TypeScript file
- **Debug P100 Example** - Debug P100 plug example
- **Debug P105 Example** - Debug P105 plug example  
- **Debug P110 Example** - Debug P110 plug example
- **Debug Wrapper Example** - Debug wrapper example
- **Debug Jest Tests** - Debug all Jest tests
- **Debug Current Jest Test** - Debug currently open test file

#### How to Debug:
1. Open any TypeScript file (e.g., `examples/p105-plug-example.ts`)
2. Set breakpoints by clicking in the gutter
3. Press `F5` or go to **Run and Debug** panel
4. Select **"Debug Current File"** from the dropdown
5. Click the green play button

The debugger will:
- Automatically load environment variables from `.env`
- Use ts-node for TypeScript execution
- Provide source map support
- Skip Node.js internals for cleaner debugging

### Environment Setup

Create a `.env` file in the project root:

```env
TAPO_USERNAME=your-tapo-email@example.com
TAPO_PASSWORD=your-tapo-password
PLUG_IP=192.168.1.100
P110_PLUG_IP=192.168.1.110
```

## Architecture

### Protocol Support

The library supports both modern Tapo protocols with automatic fallback:

1. **KLAP Protocol** (Primary) - Modern encrypted protocol used by newer devices
2. **Secure Passthrough** (Fallback) - Legacy protocol for older devices

### Error Recovery

- Automatic protocol switching on failure
- Session management with automatic re-authentication
- Rate limiting to prevent device overload
- Graceful handling of device busy states

### Type Safety

Full TypeScript support with:
- Comprehensive type definitions
- Generic error types
- Result pattern for explicit error handling
- Device capability interfaces

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

This project is a TypeScript port inspired by the Python [mihai-dinculescu/tapo](https://github.com/mihai-dinculescu/tapo) library, providing the same functionality with modern TypeScript/Node.js features.
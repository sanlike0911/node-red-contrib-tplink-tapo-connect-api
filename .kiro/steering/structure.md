# Project Structure

## Root Directory Organization

```
node-red-contrib-tplink-tapo-connect-api/
├── .claude/                   # Claude Code configuration
│   └── commands/             # Custom slash commands
├── .kiro/                    # Kiro spec-driven development
│   └── steering/            # Steering documents (this file)
├── src/                     # Source code (TypeScript)
├── dist/                    # Compiled JavaScript output
├── nodes/                   # Built Node-RED package
├── data/                    # Local Node-RED development environment
├── examples/                # Usage examples and flows
├── figs/                    # Documentation images
├── node_modules/            # Dependencies
├── package.json             # Main package configuration
├── tsconfig.json           # TypeScript compiler configuration
├── README.md               # Project documentation
├── CLAUDE.md               # Development specifications
└── LICENSE                 # Apache license
```

## Source Code Architecture (`src/`)

### Node-RED Integration Layer
```
src/nodes/
├── tplink_*.ts             # Node-RED node implementations
├── tplink_*.html           # Node-RED UI definitions
├── type.ts                 # Shared TypeScript types
├── icons/                  # Node icons for Node-RED UI
├── locales/                # Internationalization files
│   ├── en-US/             # English translations
│   └── ja/                # Japanese translations
└── test/                   # Node-RED specific tests
    └── *_spec.js          # Mocha test files
```

### New API Implementation (`src/nodes/tplink-tapo-connect/`)
```
src/nodes/tplink-tapo-connect/
├── src/
│   ├── core/                    # Core infrastructure
│   │   ├── auth.ts             # Authentication management
│   │   ├── klap-auth.ts        # KLAP protocol authentication
│   │   ├── crypto.ts           # Encryption/decryption utilities
│   │   ├── http-client.ts      # HTTP communication layer
│   │   ├── connection-manager.ts # Connection lifecycle
│   │   ├── session-manager.ts   # Session state management
│   │   ├── device-manager.ts    # Device instance management
│   │   ├── protocol-selector.ts # Protocol negotiation
│   │   ├── request-manager.ts   # Request coordination
│   │   ├── unified-protocol.ts  # Protocol abstraction
│   │   └── index.ts            # Core module exports
│   ├── devices/                 # Device implementations
│   │   ├── base-device.ts      # Abstract base device class
│   │   ├── plug-device.ts      # Smart plug implementation
│   │   ├── bulb-device.ts      # Smart bulb implementation
│   │   ├── generic-device-info.ts # Common device info
│   │   ├── plugs/              # Plug-specific implementations
│   │   │   ├── index.ts
│   │   │   ├── p100-plug.ts    # P100 specific features
│   │   │   ├── p105-plug.ts    # P105 specific features
│   │   │   ├── p110-plug.ts    # P110 energy monitoring
│   │   │   └── tp15-plug.ts    # TP15 experimental support
│   │   ├── bulbs/              # Bulb-specific implementations
│   │   │   ├── index.ts
│   │   │   ├── base-bulb.ts    # Common bulb functionality
│   │   │   ├── l510-bulb.ts    # Dimmable bulb (L510)
│   │   │   ├── l520-bulb.ts    # Dimmable bulb (L520)
│   │   │   ├── l530-bulb.ts    # Color bulb (L530)
│   │   │   └── l535-bulb.ts    # Color bulb (L535)
│   │   └── index.ts            # Device exports
│   ├── controllers/             # Feature controllers
│   │   ├── device-controller.ts    # Basic device operations
│   │   ├── energy-controller.ts    # Energy monitoring
│   │   └── lighting-controller.ts  # Light-specific controls
│   ├── services/                # High-level services
│   │   ├── device-control-service.ts # Device control coordination
│   │   └── batch-operation-service.ts # Batch operations
│   ├── factory/                 # Factory patterns
│   │   └── device-factory.ts   # Device instantiation
│   ├── types/                   # TypeScript definitions
│   │   ├── base.ts             # Common types
│   │   ├── device-common.ts    # Device-specific types
│   │   ├── device-types.ts     # Device type definitions
│   │   ├── bulb.ts             # Bulb-specific types
│   │   ├── plugs.ts            # Plug-specific types
│   │   ├── retry-options.ts    # Retry configuration
│   │   ├── wrapper-types.ts    # Wrapper interface types
│   │   └── index.ts            # Type exports
│   ├── utils/                   # Utility functions
│   │   ├── error-classifier.ts # Error categorization
│   │   ├── retry-utils.ts      # Retry mechanisms
│   │   └── index.ts            # Utility exports
│   ├── wrapper/                 # Legacy compatibility
│   │   └── tplink-tapo-connect-wrapper.ts # Wrapper implementation
│   └── index.ts                 # Main API exports
├── examples/                    # Usage examples
│   ├── plug-example.ts         # Smart plug usage
│   ├── bulb-example.ts         # Smart bulb usage
│   └── wrapper-example.ts      # Wrapper usage
├── tests/                       # Test suite
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── __mocks__/              # Test mocks
│   └── fixtures/               # Test data
├── document/                    # Technical documentation
├── package.json                # Sub-package configuration
└── tsconfig.json              # TypeScript config for this module
```

## File Naming Conventions

### Node-RED Components
- **Node Implementation**: `tplink_{feature}.ts` (e.g., `tplink_toggle.ts`)
- **Node UI Definition**: `tplink_{feature}.html` (e.g., `tplink_toggle.html`)
- **Test Files**: `{feature}_spec.js` (e.g., `tplink_turn_on_spec.js`)

### TypeScript Modules
- **Kebab Case**: `device-controller.ts`, `connection-manager.ts`
- **Device Classes**: `{model}-{type}.ts` (e.g., `p100-plug.ts`, `l530-bulb.ts`)
- **Type Definitions**: Descriptive names in `types/` directory

### Configuration Files
- **Package Config**: `package.json` (main and sub-package)
- **TypeScript Config**: `tsconfig.json` (main and per-module)
- **Build Config**: Build scripts in package.json

## Import Organization

### Module Resolution Strategy
```typescript
// Core infrastructure imports
import { HttpClient } from '../core/http-client';
import { KlapAuth } from '../core/klap-auth';

// Device-specific imports
import { BaseDevice } from '../devices/base-device';
import { P100Plug } from '../devices/plugs/p100-plug';

// Type imports (separate from implementation)
import type { DeviceInfo, EnergyData } from '../types';

// Utility imports
import { RetryUtils } from '../utils/retry-utils';
```

### Barrel Exports Pattern
```typescript
// src/core/index.ts - Aggregates core functionality
export { HttpClient } from './http-client';
export { KlapAuth } from './klap-auth';
export { DeviceManager } from './device-manager';

// src/devices/index.ts - Aggregates device classes
export { BaseDevice } from './base-device';
export { PlugDevice } from './plug-device';
export { BulbDevice } from './bulb-device';

// src/types/index.ts - Aggregates type definitions
export type { DeviceInfo } from './base';
export type { EnergyData } from './plugs';
export type { LightingState } from './bulb';
```

## Code Organization Patterns

### Device Hierarchy Pattern
```typescript
// Base class with common functionality
abstract class BaseDevice {
  protected abstract deviceType: string;
  abstract getPowerState(): Promise<boolean>;
}

// Device category classes
class PlugDevice extends BaseDevice {
  // Plug-specific functionality
}

class BulbDevice extends BaseDevice {
  // Bulb-specific functionality
}

// Model-specific implementations
class P100Plug extends PlugDevice {
  // P100-specific features
}
```

### Wrapper Interface Pattern
```typescript
// Legacy compatibility through wrapper
class TplinkTapoConnectWrapper {
  private static instance: TplinkTapoConnectWrapper;

  // Singleton pattern for backward compatibility
  static getInstance(): TplinkTapoConnectWrapper {
    if (!this.instance) {
      this.instance = new TplinkTapoConnectWrapper();
    }
    return this.instance;
  }

  // Wrapper methods maintain existing interface
  async loginDeviceByIp(/* parameters */): Promise<Result> {
    // Delegate to new implementation
  }
}
```

### Service Layer Pattern
```typescript
// High-level service coordination
class DeviceControlService {
  constructor(
    private deviceManager: DeviceManager,
    private connectionManager: ConnectionManager
  ) {}

  async controlDevice(/* parameters */): Promise<ControlResult> {
    // Orchestrate multiple lower-level operations
  }
}
```

## Key Architectural Principles

### Separation of Concerns
- **Protocol Layer**: Core communication and authentication
- **Device Layer**: Device-specific implementations
- **Service Layer**: High-level business logic
- **Wrapper Layer**: Backward compatibility interface

### Dependency Injection
- Constructor injection for testability
- Interface-based dependencies
- Service composition patterns

### Error Handling Strategy
- Centralized error classification
- Typed error responses
- Retry mechanisms with exponential backoff

### Configuration Management
- Environment-based configuration
- TypeScript interfaces for type safety
- Centralized configuration objects

### Testing Strategy
- Unit tests for individual components
- Integration tests for service interactions
- Mock factories for external dependencies
- Fixture data for consistent testing
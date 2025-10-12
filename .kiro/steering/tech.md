# Technology Stack

## Architecture Overview

This project implements a **migration-based architecture** where a new KLAP-compatible API is being developed to replace the legacy implementation while maintaining backward compatibility through a wrapper pattern.

### Core Architecture Pattern
```
Node-RED Application Layer
           ↓
Wrapper Interface (Compatibility Layer)
           ↓
New API Implementation (KLAP Support)
           ↓
TP-Link Tapo Devices (Local Network)
```

## Runtime Environment

### Node.js Platform
- **Minimum Version**: Node.js 18.0.0+
- **Package Manager**: npm
- **Module System**: CommonJS (for Node-RED compatibility)
- **Type System**: TypeScript for development, compiled to JavaScript

### Node-RED Integration
- **Node-RED Version**: >=2.0.0
- **Node Registration**: Custom node types registered through package.json
- **Runtime Environment**: Embedded within Node-RED server instance

## Programming Languages & Core Technologies

### TypeScript/JavaScript
- **TypeScript Version**: ^5.7.2
- **Target**: ES2019 (tsconfig.json)
- **Module Format**: CommonJS for Node-RED compatibility
- **Compilation Output**: `./dist` directory
- **Type Definitions**: Generated `.d.ts` files for API consumers

### Core Dependencies

#### Authentication & Security
```json
{
  "crypto-js": "^4.2.0",      // AES encryption, RSA key exchange
  "uuid": "^11.1.0"           // Session management, request IDs
}
```

#### Network Communication
```json
{
  "axios": "^1.12.0",         // HTTP/HTTPS requests to devices
  "local-devices": "^4.0.0",  // Device discovery on local network
  "arpping": "^4.0.0"         // ARP ping for device availability
}
```

#### Development & Build Tools
```json
{
  "typescript": "^5.7.2",
  "ts-node": "^10.9.2",       // Development execution
  "ts-node-dev": "^2.0.0",    // Development with hot reload
  "mocha": "^11.7.1",         // Test framework
  "rimraf": "^6.0.1",         // Clean build directories
  "cpx2": "^8.0.0",           // File copying for build process
  "npm-run-all2": "^8.0.4"    // Script orchestration
}
```

## Protocol Implementation

### KLAP Protocol (Modern)
- **Authentication**: Local authentication with username/password
- **Encryption**: AES encryption for secure communication
- **Session Management**: Token-based session handling
- **Protocol Version**: V1/V2 support with automatic detection

### Legacy Protocol Support
- **Secure Passthrough**: Older authentication method
- **Cloud Authentication**: Email/password cloud login fallback
- **Backward Compatibility**: Maintains support for older devices

## Development Environment

### Build System
```bash
# Core build commands
npm run clean          # Remove dist and build artifacts
npm run tsc           # TypeScript compilation only
npm run build         # Full build: clean + compile + copy assets
npm run copy          # Copy HTML, icons, locales, and package files
```

### Development Workflow
```bash
# Development commands
npm run start                    # Start Node-RED on port 1880
npm run start:debug             # Start with Node.js debugger
npm run install:my-node         # Install built package into local Node-RED
```

### Testing Infrastructure
```bash
# Test commands
npm run test                    # Run Mocha tests
# Test files: src/nodes/test/*_spec.js
```

## File Organization Strategy

### Source Structure
```
src/nodes/
├── tplink-tapo-connect/        # New KLAP-compatible API
│   ├── src/
│   │   ├── core/              # Authentication, encryption, HTTP
│   │   ├── devices/           # Device-specific implementations
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── wrapper/           # Wrapper implementation
│   └── examples/              # Usage examples
├── tplink_*.ts                # Node-RED node implementations
├── tplink_*.html              # Node-RED UI definitions
├── icons/                     # Node icons for Node-RED
├── locales/                   # Internationalization (en-US, ja)
└── test/                      # Test files
```

### Build Output Structure
```
dist/                          # Compiled TypeScript
nodes/                         # Node-RED installable package
data/my-node/                  # Local development Node-RED instance
```

## Environment Configuration

### Required Environment Variables
```bash
# Development (optional)
NODE_ENV=development

# Node-RED Configuration
USERDIR=./data                 # Node-RED user directory
PORT=1880                      # Node-RED server port
```

### Local Development Setup
- **User Directory**: `./data` (isolated Node-RED instance)
- **Debug Port**: 9229 (when using start:debug)
- **Auto-reload**: Supported through ts-node-dev

## Package Distribution

### NPM Package Structure
- **Entry Point**: Not applicable (Node-RED nodes only)
- **Files Included**: examples/, figs/, nodes/, README.md, LICENSE
- **Node-RED Registration**: Defined in package.json `node-red` section

### Node-RED Node Registration
```json
{
  "node-red": {
    "version": ">=2.0.0",
    "nodes": {
      "tplink_command": "nodes/tplink_command.js",
      "tplink_brightness": "nodes/tplink_brightness.js",
      "tplink_colour": "nodes/tplink_colour.js",
      "tplink_status": "nodes/tplink_status.js",
      "tplink_toggle": "nodes/tplink_toggle.js",
      "tplink_turn_off": "nodes/tplink_turn_off.js",
      "tplink_turn_on": "nodes/tplink_turn_on.js"
    }
  }
}
```

## Security Considerations

### Local Network Communication
- **No Cloud Dependency**: All communication happens locally
- **Encrypted Protocols**: KLAP provides AES encryption
- **Authentication**: Device-specific credentials required

### Code Security
- **Type Safety**: TypeScript provides compile-time type checking
- **Input Validation**: Proper validation in wrapper interfaces
- **Error Handling**: Comprehensive error management throughout stack

## Performance Optimization

### Build Optimization
- **Incremental Compilation**: TypeScript watch mode available
- **Asset Copying**: Efficient file operations with cpx2
- **Development Server**: Fast restart with ts-node-dev

### Runtime Optimization
- **Connection Pooling**: Efficient HTTP client reuse
- **Session Management**: Cached authentication tokens
- **Error Recovery**: Automatic retry mechanisms for network operations
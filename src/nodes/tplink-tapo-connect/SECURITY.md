# Security Policy

## Overview

This document outlines the security considerations, practices, and policies for the TP-Link Tapo Connect library. This library provides local network communication with TP-Link Tapo smart home devices and handles sensitive authentication data.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

### Authentication & Encryption

- **KLAP Protocol Support**: Implements both KLAP V1 and V2 with automatic version detection
- **RSA Encryption**: Uses RSA-OAEP (SHA1) with PKCS#1 v1.5 fallback for key exchange
- **AES Encryption**: AES-128-CBC for payload encryption in KLAP protocol
- **Secure Passthrough**: Alternative authentication method with encrypted communication
- **Session Management**: Secure session handling with automatic refresh capabilities

### Network Security

- **Local Network Only**: Designed for local network communication only
- **No Cloud Dependencies**: Direct device communication without cloud services
- **Protocol Fallback**: Automatic protocol selection with secure fallback mechanisms
- **Connection Validation**: Proper certificate and connection validation

## Security Best Practices

### For Library Users

#### 1. Credential Management

```typescript
// ✅ GOOD: Use environment variables or secure storage
const credentials = {
  username: process.env.TAPO_USERNAME,
  password: process.env.TAPO_PASSWORD
};

// ❌ BAD: Never hardcode credentials
const credentials = {
  username: "admin",
  password: "password123"
};
```

#### 2. Network Security

```typescript
// ✅ GOOD: Validate IP addresses
function isValidLocalIP(ip: string): boolean {
  const localRanges = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./
  ];
  return localRanges.some(range => range.test(ip));
}

// ✅ GOOD: Use HTTPS when available
const deviceIP = "192.168.1.100";
if (isValidLocalIP(deviceIP)) {
  const device = await TapoConnect.createDevice(deviceIP, credentials);
}
```

#### 3. Error Handling

```typescript
// ✅ GOOD: Handle errors without exposing sensitive information
try {
  await device.turnOn();
} catch (error) {
  console.error('Device operation failed'); // Don't log sensitive details
  // Handle error appropriately
}

// ❌ BAD: Don't expose authentication details in logs
catch (error) {
  console.error('Auth failed:', credentials); // Never do this
}
```

#### 4. Session Management

```typescript
// ✅ GOOD: Properly disconnect when done
try {
  const device = await TapoConnect.createDevice(ip, credentials);
  await device.turnOn();
} finally {
  await device.disconnect(); // Always clean up
}
```

### For Library Developers

#### 1. Input Validation

- All IP addresses must be validated as local network addresses
- Credentials must be properly sanitized before use
- API responses must be validated before processing

#### 2. Memory Management

- Clear sensitive data from memory when no longer needed
- Avoid storing credentials longer than necessary
- Use secure random number generation for cryptographic operations

#### 3. Logging Security

- Never log credentials or session tokens
- Sanitize error messages to prevent information disclosure
- Use appropriate log levels for security-related events

## Known Security Considerations

### 1. Local Network Requirement

This library is designed for **local network use only**. Using it over public networks or the internet is not recommended and may expose your credentials and device communications.

### 2. Credential Storage

The library does not store credentials persistently. Applications using this library are responsible for secure credential management.

### 3. Device Firmware Vulnerabilities

This library communicates with TP-Link devices that may have their own security vulnerabilities. Keep device firmware updated to the latest versions.

### 4. Network Sniffing

While communications are encrypted, ensure your local network is secure from unauthorized access.

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

Please do not create public issues for security vulnerabilities.

### 2. Contact Information

Report security vulnerabilities through one of these channels:

- **GitHub Security Advisories**: Use the "Security" tab in the GitHub repository
- **Email**: [Create an issue](https://github.com/anthropics/claude-code/issues) with "[SECURITY]" in the title

### 3. Include in Your Report

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact and exploitation scenarios
- Any suggested fixes or mitigations

### 4. Response Timeline

- **Initial Response**: Within 48 hours of receipt
- **Status Update**: Within 7 days with assessment and timeline
- **Resolution**: Security fixes will be prioritized and released as soon as possible

## Security Checklist for Developers

### Before Release

- [ ] All credentials are properly encrypted/hashed
- [ ] No hardcoded secrets in code
- [ ] Input validation implemented for all user inputs
- [ ] Error messages don't expose sensitive information
- [ ] Secure random number generation used for cryptographic operations
- [ ] Dependencies scanned for known vulnerabilities
- [ ] Authentication mechanisms tested against common attacks

### Code Review

- [ ] No credentials in logs or debug output
- [ ] Proper error handling without information disclosure
- [ ] Session management follows security best practices
- [ ] Network communications are encrypted
- [ ] Input validation covers all attack vectors

## Dependencies and Third-Party Security

### Regular Updates

We regularly update dependencies to address security vulnerabilities. Users should:

- Keep the library updated to the latest version
- Monitor security advisories for dependencies
- Use `npm audit` to check for vulnerable dependencies

### Key Dependencies

- **axios**: HTTP client for network communications
- **crypto**: Node.js built-in cryptographic functions
- **jest**: Testing framework (dev dependency)

## Compliance and Standards

### Cryptographic Standards

- **RSA**: RSA-OAEP with SHA1, PKCS#1 v1.5 fallback
- **AES**: AES-128-CBC with proper IV generation
- **Random Generation**: Cryptographically secure random number generation

### Protocol Implementation

- **KLAP V1/V2**: Implements official TP-Link KLAP protocol specifications
- **Secure Passthrough**: Alternative authentication method support
- **Session Management**: Proper session lifecycle management

## Security Testing

### Automated Testing

- Unit tests include security-focused test cases
- Integration tests verify encryption/decryption
- Protocol implementation tests ensure proper security measures

### Manual Testing

Regular manual security testing includes:

- Authentication mechanism validation
- Encryption/decryption verification
- Session management testing
- Error handling validation

## License and Disclaimer

This software is provided "as is" without warranty of any kind. Users are responsible for ensuring their use of this library complies with applicable laws and regulations regarding network security and device access.

---

**Last Updated**: January 2025
**Version**: 1.0.0
# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.5.x   | :white_check_mark: |
| < 0.5   | :x:                |

## Security Features

### Credential Protection
- **Encrypted Storage**: TP-Link account credentials (email/password) are stored using Node-RED's built-in credential encryption mechanism
- **Memory Protection**: Credentials are not logged or exposed in debug output
- **Secure Transmission**: All communications with TP-Link devices use HTTPS/TLS encryption

### Network Security
- **KLAP Protocol Support**: Implements the new KLAP (Kasa Link Authentication Protocol) for enhanced security
- **Local Network Communication**: Direct communication with devices on local network, minimizing external attack surface
- **IP Validation**: Device IP addresses are validated before connection attempts

### Authentication & Authorization
- **Device Authentication**: Secure handshake with TP-Link devices using official protocols
- **Session Management**: Proper session handling with automatic cleanup
- **Rate Limiting**: Built-in rate limiting to prevent abuse and device overload (2-second cooldown between operations)

## Security Best Practices

### For Users
1. **Strong Credentials**: Use strong, unique passwords for your TP-Link account
2. **Network Security**: Ensure your local network is properly secured with WPA3/WPA2
3. **Device Updates**: Keep your TP-Link devices firmware up to date
4. **Node-RED Security**: Follow Node-RED security best practices for your installation
5. **Credential Rotation**: Regularly update your TP-Link account credentials

### For Developers
1. **No Hardcoded Secrets**: Never commit credentials or API keys to the repository
2. **Input Validation**: All user inputs are validated before processing
3. **Error Handling**: Sensitive information is not exposed in error messages
4. **Logging**: Credentials and sensitive data are excluded from logs

## Known Security Considerations

### Local Network Access
- This plugin requires network access to communicate with TP-Link devices
- Devices must be on the same local network as the Node-RED instance
- No internet connectivity is required for device control (only for initial authentication)

### Credential Storage
- TP-Link account credentials are required for device authentication
- Credentials are stored using Node-RED's encrypted credential system
- Consider using dedicated TP-Link accounts with minimal privileges

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please help us maintain the security of our users by reporting it responsibly.

### How to Report
1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Send an email to the project maintainer with details of the vulnerability
3. Include steps to reproduce the issue if possible
4. Allow reasonable time for the vulnerability to be addressed before public disclosure

### What to Include
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if available)

### Response Timeline
- **24 hours**: Initial acknowledgment of the report
- **7 days**: Preliminary assessment and severity classification
- **30 days**: Target timeline for fix and release (may vary based on complexity)

## Security Updates

Security updates will be released as patch versions and communicated through:
- GitHub Releases with security advisory tags
- NPM package updates
- README and CHANGELOG updates

## Disclaimer

This is an unofficial Node-RED plugin for TP-Link Tapo devices. While we implement security best practices, users should:
- Review the code before use in production environments
- Understand the security implications of IoT device control
- Follow their organization's security policies and compliance requirements

## License and Legal

This project is licensed under the Apache License 2.0. Users are responsible for compliance with:
- Local privacy and data protection laws
- Network security policies
- TP-Link terms of service
- Node-RED security guidelines

---

**Last Updated**: 2025-07-30
**Next Review**: 2025-10-30

For questions about this security policy, please contact the project maintainers through GitHub issues (for non-security matters) or email (for security concerns).
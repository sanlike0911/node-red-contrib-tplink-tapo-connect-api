# Product Overview

## Product Description

**node-red-contrib-tplink-tapo-connect-api** is an unofficial Node-RED contribution package that enables local programmatic control of TP-Link Tapo smart devices. This project provides custom Node-RED nodes for controlling various TP-Link Tapo devices including smart plugs, smart bulbs, and energy monitoring devices through your local network.

## Core Features

### Smart Device Control
- **Power Management**: On/Off control for all supported devices
- **Advanced Lighting Control**: Brightness adjustment, color control, color temperature setting
- **Energy Monitoring**: Real-time power consumption and energy usage data (P110/P115 models)
- **Device Status Monitoring**: Comprehensive device information and health status

### Node-RED Integration
- **Custom Node Types**: 7 specialized nodes for different control functions
  - `tplink_toggle` - Power toggle functionality
  - `tplink_turn_on` / `tplink_turn_off` - Direct power control
  - `tplink_brightness` - Light brightness control
  - `tplink_colour` - Color control for smart bulbs
  - `tplink_command` - Universal command interface
  - `tplink_status` - Device status retrieval

### Protocol Support
- **KLAP Protocol**: Modern authentication protocol (v0.50+)
- **Legacy API Support**: Backward compatibility with older devices
- **Local Network Communication**: Direct device control without cloud dependency

## Supported Devices

### Smart Plugs
| Model | Energy Monitoring | Status |
|-------|------------------|--------|
| P100  | ❌ | ✅ Supported |
| P105  | ❌ | ✅ Supported |
| P110  | ✅ | ✅ Supported |
| P115  | ✅ | ✅ Supported |
| TP15  | ❌ | 🧪 Experimental |

### Smart Bulbs
| Model | Type | Color Support | Status |
|-------|------|---------------|--------|
| L510  | Dimmable | ❌ | ✅ Supported |
| L520  | Dimmable | ❌ | ✅ Supported |
| L530  | Color | ✅ | ✅ Supported |
| L535  | Color | ✅ | ✅ Supported |

## Target Use Cases

### Home Automation Integration
- **Node-RED Flows**: Integrate Tapo devices into complex automation workflows
- **Conditional Logic**: Device control based on sensors, time, or external triggers
- **Scene Management**: Coordinated control of multiple devices

### Energy Management
- **Power Monitoring**: Track energy consumption patterns
- **Cost Analysis**: Monitor electricity usage and costs
- **Efficiency Optimization**: Automated power management for energy savings

### Developer Integration
- **IoT Projects**: Local device control for custom applications
- **Home Assistant Integration**: Bridge for other home automation platforms
- **Custom Dashboards**: Real-time device monitoring and control interfaces

## Key Value Proposition

### Local Control Priority
- **No Cloud Dependency**: Direct local network communication
- **Enhanced Privacy**: Device control without data leaving your network
- **Improved Reliability**: Reduced latency and dependency on internet connectivity

### Node-RED Ecosystem Integration
- **Visual Programming**: Drag-and-drop interface for automation logic
- **Extensive Compatibility**: Works with thousands of other Node-RED nodes
- **Community Support**: Active Node-RED community and ecosystem

### Migration and Future-Proofing
- **Protocol Evolution**: Built-in support for both legacy and modern protocols
- **AI-Enhanced Development**: Enhanced with AI support for new features
- **Wrapper Architecture**: Minimal breaking changes during API migrations

## Development Status

### Current Version: v0.5.8
- **KLAP Protocol Support**: Modern authentication implementation
- **Simplified Functionality**: Streamlined for optimal performance
- **Docker Support**: Container-ready deployment
- **Multi-language Support**: English and Japanese localization

### Migration Project
- **Source**: Migrating from older API implementation
- **Target**: New KLAP-compatible API in `src/nodes/tplink-tapo-connect/`
- **Compatibility**: Wrapper pattern maintains existing application compatibility
import { TapoDeviceInfo } from '../../src/types/base';

export const DEVICE_RESPONSES = {
  // P100 Plug Responses
  P100_DEVICE_INFO: {
    device_id: "test-p100-device-id",
    fw_ver: "1.0.0",
    hw_ver: "1.0.0",
    type: "SMART.TAPOPLUG",
    model: "P100",
    mac: "00:11:22:33:44:55",
    hw_id: "test-hw-id",
    fw_id: "test-fw-id",
    oem_id: "test-oem-id",
    specs: "EU",
    device_on: true,
    on_time: 3600,
    overheated: false,
    nickname: "Test P100 Plug",
    location: "Test Location",
    avatar: "plug",
    longitude: 0,
    latitude: 0,
    has_set_location_info: false,
    ip: "192.168.1.100",
    ssid: "TestWiFi",
    signal_level: 3,
    rssi: -45,
    region: "Europe/Berlin",
    time_diff: 60,
    lang: "en_US",
    default_states: {
      type: "last_states",
      state: {}
    },
    auto_off_status: "off",
    auto_off_remain_time: 0
  } as TapoDeviceInfo,

  // P110 Plug Responses
  P110_ENERGY_DATA: {
    today_runtime: 480,
    month_runtime: 14400,
    today_energy: 250,
    month_energy: 7500,
    local_time: "2024-01-15 10:30:00",
    electricity_charge: [120, 130, 125]
  },

  P110_CURRENT_POWER: {
    current_power: 15500 // milliwatts
  },

  // L510 Bulb Responses
  L510_DEVICE_INFO: {
    device_id: "test-l510-device-id",
    fw_ver: "1.0.0",
    hw_ver: "1.0.0",
    type: "SMART.TAPOBULB",
    model: "L510",
    mac: "00:11:22:33:44:66",
    hw_id: "test-hw-id",
    fw_id: "test-fw-id",
    oem_id: "test-oem-id",
    specs: "EU",
    device_on: true,
    on_time: 1800,
    overheated: false,
    nickname: "Test L510 Bulb",
    location: "Test Location",
    avatar: "bulb",
    longitude: 0,
    latitude: 0,
    has_set_location_info: false,
    ip: "192.168.1.103",
    ssid: "TestWiFi",
    signal_level: 3,
    rssi: -42,
    region: "Europe/Berlin",
    time_diff: 60,
    lang: "en_US",
    default_states: {
      type: "last_states",
      state: {
        brightness: 50
      }
    },
    auto_off_status: "off",
    auto_off_remain_time: 0
  } as TapoDeviceInfo,

  L510_BRIGHTNESS_RESPONSE: {
    brightness: 75
  },

  // L530 Color Bulb Responses
  L530_DEVICE_INFO: {
    device_id: "test-l530-device-id",
    fw_ver: "1.0.0",
    hw_ver: "1.0.0",
    type: "SMART.TAPOBULB",
    model: "L530",
    mac: "00:11:22:33:44:77",
    hw_id: "test-hw-id",
    fw_id: "test-fw-id",
    oem_id: "test-oem-id",
    specs: "EU",
    device_on: true,
    on_time: 2400,
    overheated: false,
    nickname: "Test L530 Color Bulb",
    location: "Test Location",
    avatar: "bulb",
    longitude: 0,
    latitude: 0,
    has_set_location_info: false,
    ip: "192.168.1.104",
    ssid: "TestWiFi",
    signal_level: 4,
    rssi: -38,
    region: "Europe/Berlin",
    time_diff: 60,
    lang: "en_US",
    default_states: {
      type: "last_states",
      state: {
        brightness: 80,
        hue: 180,
        saturation: 100,
        color_temp: 4000
      }
    },
    auto_off_status: "off",
    auto_off_remain_time: 0
  } as TapoDeviceInfo,

  L530_COLOR_TEMP_RESPONSE: {
    color_temp: 4000
  },

  L530_COLOR_RESPONSE: {
    hue: 240,
    saturation: 80
  },

  L530_LIGHT_EFFECT_RESPONSE: {
    effect: "Rainbow"
  },

  // Generic Success Responses
  SUCCESS_RESPONSE: {
    success: true,
    error_code: 0
  },

  TURN_ON_RESPONSE: {
    device_on: true
  },

  TURN_OFF_RESPONSE: {
    device_on: false
  },

  // Error Responses
  ERROR_RESPONSES: {
    INVALID_REQUEST: {
      error_code: -1010,
      msg: "Invalid Request"
    },
    
    SESSION_TIMEOUT: {
      error_code: -1501,
      msg: "Session Timeout"
    },
    
    DEVICE_OFFLINE: {
      error_code: -1003,
      msg: "Device Offline"
    },
    
    AUTHENTICATION_FAILED: {
      error_code: -1002,
      msg: "Authentication Failed"
    },
    
    INVALID_PUBLIC_KEY: {
      error_code: -1012,
      msg: "Invalid Public Key"
    }
  },

  // Protocol Specific Responses
  KLAP_HANDSHAKE_RESPONSE: {
    server_hash: "mock-server-hash",
    server_challenge: "mock-server-challenge"
  },

  KLAP_V1_AUTH_RESPONSE: {
    version: 1,
    auth_hash: "mock-auth-hash-v1"
  },

  KLAP_V2_AUTH_RESPONSE: {
    version: 2,
    auth_hash: "mock-auth-hash-v2"
  },

  SECURE_PASSTHROUGH_HANDSHAKE: {
    key: "mock-handshake-key",
    iv: "mock-handshake-iv"
  }
};

// Helper functions for creating dynamic responses
export const createSuccessResponse = (data: any) => ({
  error_code: 0,
  result: data
});

export const createErrorResponse = (errorCode: number, message: string) => ({
  error_code: errorCode,
  msg: message
});

export const createDeviceInfoWithOverrides = (baseInfo: TapoDeviceInfo, overrides: Partial<TapoDeviceInfo>) => ({
  ...baseInfo,
  ...overrides
});

// Test scenarios data
export const TEST_SCENARIOS = {
  NETWORK_TIMEOUTS: {
    SHORT_TIMEOUT: 1000,
    MEDIUM_TIMEOUT: 5000,
    LONG_TIMEOUT: 10000
  },
  
  RETRY_COUNTS: {
    DEFAULT: 3,
    HIGH: 5,
    LOW: 1
  },
  
  DEVICE_STATES: {
    ON: { device_on: true },
    OFF: { device_on: false },
    UNKNOWN: { device_on: null }
  },
  
  COLOR_TEMPERATURES: {
    WARM: 2700,
    NEUTRAL: 4000,
    COOL: 6500,
    INVALID_LOW: 2000,
    INVALID_HIGH: 7000
  },
  
  BRIGHTNESS_VALUES: {
    MIN: 1,
    MAX: 100,
    MEDIUM: 50,
    INVALID_LOW: 0,
    INVALID_HIGH: 101
  },
  
  HSV_VALUES: {
    RED: { hue: 0, saturation: 100 },
    GREEN: { hue: 120, saturation: 100 },
    BLUE: { hue: 240, saturation: 100 },
    INVALID_HUE: { hue: 400, saturation: 100 },
    INVALID_SATURATION: { hue: 180, saturation: 150 }
  }
};
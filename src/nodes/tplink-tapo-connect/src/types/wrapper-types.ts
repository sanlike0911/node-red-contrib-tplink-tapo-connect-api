import { TapoDeviceInfo } from './base';

export namespace tplinkTapoConnectWrapperType {
    export type tapoConnectResults = {
        result: boolean;
        tapoDeviceInfo?: TapoDeviceInfo;
        tapoEnergyUsage?: any | undefined;
        errorInf?: Error;
    }
}

// Type for the device control interface returned by TapoDevice factory
export type TapoDeviceControlInterface = {
    turnOn: (deviceId?: string) => Promise<void>;
    turnOff: (deviceId?: string) => Promise<void>;
    setBrightness: (brightnessLevel?: number) => Promise<void>;
    setColour: (colour?: string) => Promise<void>;
    setHSL: (hue: number, sat: number, lum: number) => Promise<void>;
    getDeviceInfo: () => Promise<TapoDeviceInfo>;
    getChildDevicesInfo: () => Promise<Array<TapoDeviceInfo>>;
    getEnergyUsage: () => Promise<any>;
    // Convenience methods following Python API pattern
    on: () => Promise<void>;
    off: () => Promise<void>;
    getCurrentPower?: () => Promise<any>;
    // Cleanup method for session management
    close?: () => Promise<void>;
}

export type TapoProtocol = {
    send: (request: any) => any
    close?: () => Promise<void>
}

export type TapoDeviceKey = {
    key: Buffer;
    iv: Buffer;
    deviceIp: string;
    sessionCookie: string;
    token?: string;
    sessionUUID?: string;  // Add session UUID for consistency
}

export type TapoVideoImage = {
    uri: string;
    length: number;
    uriExpiresAt: number;
}

export type TapoVideo = {
    uri: string;
    duration: number;
    m3u8: string;
    startTimestamp: number;
    uriExpiresAt: number;
}

export type TapoVideoPageItem = {
    uuid: string;
    video: TapoVideo[];
    image: TapoVideoImage[];
    createdTime: number;
    eventLocalTime: string;
}

export type TapoVideoList = {
    deviceId: string;
    total: number;
    page: number;
    pageSize: number;
    index: TapoVideoPageItem[];
}
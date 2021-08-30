export namespace tplinkTapoConnectWrapperType {

    export type devicesList = {

        deviceType: string;     // "SMART.TAPOPLUG",

        role: number;           // 0,

        fwVer: string;          // "1.2.10 Build 20200609 Rel. 33394",

        appServerUrl: string;   // "https://aps1-wap.tplinkcloud.com",

        deviceRegion: string;   // "ap-southeast-1",

        deviceId: string;       // "xxxxxxxxxxxxxxxxxx",

        deviceName: string;     // "P105",

        deviceHwVer: string;    // "1.0.0",

        alias: string;          // "3d printer power supply",

        deviceMac: string;      // "xxxxxxxxxxxxxxxxxx",

        oemId: string;          // "xxxxxxxxxxxxxxxxxx",

        deviceModel: string;    // "Tapo P105(JP)",

        hwId: string;           // "xxxxxxxxxxxxxxxxxx",

        fwId: string;           // "xxxxxxxxxxxxxxxxxx",

        isSameRegion:boolean    // false,

        status: number          // 0,
    }

    export type tapoDeviceInfo = {

        device_id: string;  // "guidxxxxx"

        fw_ver: string;     // "1.2.10 Build 20200609 Rel. 33394"

        hw_ver: string;     // "1.0.0"

        type: string;       // "SMART.TAPOPLUG"

        model: string;      // "P105"

        mac: string;        // "xx-xx-xx-xx-xx-xx"

        hw_id: string;      // "guidxxxxx"

        fw_id: string;      // "guidxxxxx"

        oem_id: string;     // "guidxxxxx"

        specs: string;      // "JP"

        device_on: boolean; // false

        on_time: number;    // 0

        overheated: boolean; // false

        nickname: string;   // "3d printer power supply"

        location: string;   // "M2QgcHJpbnRlciAgZW5jbG9zdXJl"

        avatar: string;     //"plug"

        time_usage_today: number;       // 0

        time_usage_past7: number;       // 0

        time_usage_past30: number;      // 0

        longitude: number;              // 0

        latitude: number;               // 0

        has_set_location_info: boolean; // true

        ip: string;                     // "192.168.0.10"

        ssid: string;                   // "USER"

        signal_level: number;           // 2

        rssi: number;                   // -67

        region: string;                 // "Asia/Tokyo"

        time_diff: number;              // 540

        lang: string;                    // "ja_JP"

    }

    export type tapoConnectResults = {

        result: boolean;
      
        tapoDeviceInfo?: tapoDeviceInfo;

        errorInf?: Error;
      
    }

}

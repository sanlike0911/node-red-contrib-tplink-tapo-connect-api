declare namespace tplinkTapoConnectWrapperType {

    type devicesList = {

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

    type tapoConnectResults = {

        result: boolean;
      
        errorInf?: Error;
      
    }

}

export default tplinkTapoConnectWrapperType; 
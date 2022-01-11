import * as tapo from 'tp-link-tapo-connect';
export namespace tplinkTapoConnectWrapperType {

    export type tapoDevice = tapo.TapoDevice;

    export type tapoDeviceInfo = tapo.TapoDeviceInfo;

    export type tapoDeviceKey = tapo.TapoDeviceKey;

    export type tapoConnectResults = {

        result: boolean;

        tapoDeviceInfo?: tapo.TapoDeviceInfo;

        errorInf?: Error;

    }

}

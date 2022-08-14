// import * as tapo from 'tp-link-tapo-connect';
import * as tapo from './tp-link-tapo-connect/api';
export namespace tplinkTapoConnectWrapperType {

    export type tapoDevice = tapo.TapoDevice;

    export type tapoDeviceInfo = tapo.TapoDeviceInfo;

    export type tapoEnergyUsage = tapo.TapoDeviceInfo;

    export type tapoDeviceKey = tapo.TapoDeviceKey;

    export type tapoConnectResults = {

        result: boolean;

        tapoDeviceInfo?: tapo.TapoDeviceInfo;

        tapoEnergyUsage?: tapo.TapoDeviceInfo | undefined;

        errorInf?: Error;

    }

}

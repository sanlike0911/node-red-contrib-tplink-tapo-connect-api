import * as tapo from 'tp-link-tapo-connect';
import find from 'local-devices'

import tplinkTapoConnectWrapperType from './type'

/**
 *
 *
 * @export
 * @class tplinkTapoConnectWrapper
 */
export class tplinkTapoConnectWrapper {

    readonly currentWorkingDirectory:string = process.cwd();
    private static _instance: tplinkTapoConnectWrapper;

    /**
     *
     *
     * @static
     * @returns {tplinkTapoConnectWrapper}
     * @memberof tplinkTapoConnectWrapper
     */
    public static getInstance(): tplinkTapoConnectWrapper {
        if (!this._instance)
            this._instance = new tplinkTapoConnectWrapper();
        return this._instance;
    }

    /**
     *Creates an instance of tplinkTapoConnectWrapper.
    * @memberof tplinkTapoConnectWrapper
    */
    constructor() {

    }

    /**
     *
     *
     * @private
     * @param {string} _macAddress
     * @returns {string}
     * @memberof tplinkTapoConnectWrapper
     */
    private replaceMacAddress(_macAddress: string): string {
        return _macAddress.replace(/[:-]/g, '').toUpperCase();
    }

    /**
     *
     *
     * @private
     * @param {object} obj
     * @returns {boolean}
     * @memberof tplinkTapoConnectWrapper
     */
    private isEmpty(obj: object): boolean{
        return !Object.keys(obj).length;
    }

    /**
     *
     *
     * @private
     * @param {string} [_email=process.env.TAPO_USERNAME || ""]
     * @param {string} [_password=process.env.TAPO_PASSWORD || ""]
     * @param {string} [_alias=process.env.TAPO_TARGET_ALIAS || ""]
     * @returns
     * @memberof tplinkTapoConnectWrapper
     */
    private async getDeviceIpFromAlias(_email:string, _password:string, _alias: string, _rangeOfIp: string){
        let _deviceIp: string = "";
        let _devices: tplinkTapoConnectWrapperType.devicesList[] | undefined = undefined;
        _devices = await this.getTapoDevicesList(_email,_password);
        if( _devices !== undefined ){
            for (const _items of _devices) {
                if(_items.alias === _alias){
                    const _discover = await find(_rangeOfIp);
                    _deviceIp = _discover?.find((_device) => 
                        this.replaceMacAddress(_device.mac) === this.replaceMacAddress(_items.deviceMac))?.ip || "";
                    break;
                }
            }    
        } else {
            throw new Error("Failed to get tapo device list.");
        }
        return _deviceIp;
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @returns {(Promise< tplinkTapoConnectWrapper.devicesList[] | undefined >)}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDevicesList(_email:string = process.env.TAPO_USERNAME || "", _password:string): Promise< tplinkTapoConnectWrapperType.devicesList[] | undefined > {
        let cloudToken: string = "";
        let devices: tplinkTapoConnectWrapperType.devicesList[] | undefined = undefined;

        cloudToken = await tapo.cloudLogin(_email, _password);
        if( "" === cloudToken ) throw new Error("Failed to get tapo cloud token.");

        devices = await tapo.listDevicesByType(cloudToken, 'SMART.TAPOPLUG');
        if( undefined === devices ) throw new Error("Failed to get tapo device list.");

        return devices;
    }

    /**
     *
     *
     * @param {string} _ipaddr
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
     public async setTapoTurnOnAlias(_email:string, _password:string, _alias: string, _rangeOfIp: string): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
        try {
            let _targetIp: string = await this.getDeviceIpFromAlias(_email,_password,_alias,_rangeOfIp) || "";
            if( _targetIp === "" ){
                throw new Error("Failed to get tapo ip address.");
            }
            await tapo.turnOn(await tapo.loginDeviceByIp(_email, _password, _targetIp));
            return { result: true };
        } catch (error) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _ipaddr
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOffAlias(_email:string, _password:string, _alias: string, _rangeOfIp: string): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
        try {
            let _targetIp: string = await this.getDeviceIpFromAlias(_email,_password,_alias,_rangeOfIp) || "";
            if( _targetIp === "" ){
                throw new Error("Failed to get tapo ip address.");
            }
            await tapo.turnOff(await tapo.loginDeviceByIp(_email, _password, _targetIp));
            return { result: true };
        } catch (error) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @private
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDeviceInfoAlias(_email:string, _password:string, _alias: string): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
        try {
            let cloudToken = await tapo.cloudLogin(_email, _password);
            let devices = await tapo.listDevicesByType(cloudToken, 'SMART.TAPOPLUG');
            for (const _items of devices) {
                if(_items.alias === _alias){
                    let _deviceToken = await tapo.loginDevice(_email, _password, _items); 
                    let tapoDeviceInfo: tplinkTapoConnectWrapperType.tapoDeviceInfo = await tapo.getDeviceInfo(_deviceToken);
                    return { result: true, tapoDeviceInfo: tapoDeviceInfo };
                }
            }
            throw new Error("tapo device info not found.");
        } catch (error) {
            return { result: false, errorInf: error };
        }
    }

    /**
     * getTapoDeviceInfo
     *
     * @private
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
     public async getTapoDeviceInfo(_email:string, _password:string, _ipaddr: string): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
        try {
            let cloudToken = await tapo.loginDeviceByIp(_email, _password, _ipaddr);
            let tapoDeviceInfo:tplinkTapoConnectWrapperType.tapoDeviceInfo = await tapo.getDeviceInfo(cloudToken);
            if(this.isEmpty(tapoDeviceInfo)){
                throw new Error("tapo device info not found.");
            }
            return { result: true, tapoDeviceInfo: tapoDeviceInfo };
        } catch (error) {
          return { result: false, errorInf: error };
        }
    }
    
    public async getDeviceInfo(_email:string, _password:string, _ipaddr: string){
        try {
            await tapo.turnOff(await tapo.loginDeviceByIp(_email, _password, _ipaddr));
            return { result: true };
        } catch (error) {
          return { result: false, errorInf: error };
        }
    } 

    /**
     *
     *
     * @param {string} _ipaddr
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
     public async setTapoTurnOn(_email:string, _password:string, _ipaddr: string): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
        try {
            await tapo.turnOn(await tapo.loginDeviceByIp(_email, _password, _ipaddr));
            return { result: true };
        } catch (error) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _ipaddr
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
     public async setTapoTurnOff(_email:string, _password:string, _ipaddr: string): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
        try {
            await tapo.turnOff(await tapo.loginDeviceByIp(_email, _password, _ipaddr));
            return { result: true };
        } catch (error) {
          return { result: false, errorInf: error };
        }
    }
}
// export default tplinkTapoConnectWrapperType;
/* E.O.F */
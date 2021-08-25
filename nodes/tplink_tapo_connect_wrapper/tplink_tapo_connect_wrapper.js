"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tplinkTapoConnectWrapper = void 0;
const tapo = __importStar(require("tp-link-tapo-connect"));
const local_devices_1 = __importDefault(require("local-devices"));
/**
 *
 *
 * @export
 * @class tplinkTapoConnectWrapper
 */
class tplinkTapoConnectWrapper {
    /**
     *Creates an instance of tplinkTapoConnectWrapper.
    * @memberof tplinkTapoConnectWrapper
    */
    constructor() {
        this.currentWorkingDirectory = process.cwd();
    }
    /**
     *
     *
     * @static
     * @returns {tplinkTapoConnectWrapper}
     * @memberof tplinkTapoConnectWrapper
     */
    static getInstance() {
        if (!this._instance)
            this._instance = new tplinkTapoConnectWrapper();
        return this._instance;
    }
    /**
     *
     *
     * @private
     * @param {string} _macAddress
     * @returns {string}
     * @memberof tplinkTapoConnectWrapper
     */
    replaceMacAddress(_macAddress) {
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
    isEmpty(obj) {
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
    async getDeviceIpFromAlias(_email, _password, _alias, _rangeOfIp) {
        var _a;
        let _deviceIp = "";
        let _devices = undefined;
        _devices = await this.getTapoDevicesList(_email, _password);
        if (_devices !== undefined) {
            for (const _items of _devices) {
                if (_items.alias === _alias) {
                    const _discover = await local_devices_1.default(_rangeOfIp);
                    _deviceIp = ((_a = _discover === null || _discover === void 0 ? void 0 : _discover.find((_device) => this.replaceMacAddress(_device.mac) === this.replaceMacAddress(_items.deviceMac))) === null || _a === void 0 ? void 0 : _a.ip) || "";
                    break;
                }
            }
        }
        else {
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
    async getTapoDevicesList(_email = process.env.TAPO_USERNAME || "", _password) {
        let cloudToken = "";
        let devices = undefined;
        cloudToken = await tapo.cloudLogin(_email, _password);
        if ("" === cloudToken)
            throw new Error("Failed to get tapo cloud token.");
        devices = await tapo.listDevicesByType(cloudToken, 'SMART.TAPOPLUG');
        if (undefined === devices)
            throw new Error("Failed to get tapo device list.");
        return devices;
    }
    /**
     *
     *
     * @param {string} _ipaddr
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
    async setTapoTurnOnAlias(_email, _password, _alias, _rangeOfIp) {
        try {
            let _targetIp = await this.getDeviceIpFromAlias(_email, _password, _alias, _rangeOfIp) || "";
            if (_targetIp === "") {
                throw new Error("Failed to get tapo ip address.");
            }
            await tapo.turnOn(await tapo.loginDeviceByIp(_email, _password, _targetIp));
            return { result: true };
        }
        catch (error) {
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
    async setTapoTurnOffAlias(_email, _password, _alias, _rangeOfIp) {
        try {
            let _targetIp = await this.getDeviceIpFromAlias(_email, _password, _alias, _rangeOfIp) || "";
            if (_targetIp === "") {
                throw new Error("Failed to get tapo ip address.");
            }
            await tapo.turnOff(await tapo.loginDeviceByIp(_email, _password, _targetIp));
            return { result: true };
        }
        catch (error) {
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
    async getTapoDeviceInfoAlias(_email, _password, _alias) {
        try {
            let cloudToken = await tapo.cloudLogin(_email, _password);
            let devices = await tapo.listDevicesByType(cloudToken, 'SMART.TAPOPLUG');
            for (const _items of devices) {
                if (_items.alias === _alias) {
                    let _deviceToken = await tapo.loginDevice(_email, _password, _items);
                    let tapoDeviceInfo = await tapo.getDeviceInfo(_deviceToken);
                    return { result: true, tapoDeviceInfo: tapoDeviceInfo };
                }
            }
            throw new Error("tapo device info not found.");
        }
        catch (error) {
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
    async getTapoDeviceInfo(_email, _password, _ipaddr) {
        try {
            let cloudToken = await tapo.loginDeviceByIp(_email, _password, _ipaddr);
            let tapoDeviceInfo = await tapo.getDeviceInfo(cloudToken);
            if (this.isEmpty(tapoDeviceInfo)) {
                throw new Error("tapo device info not found.");
            }
            return { result: true, tapoDeviceInfo: tapoDeviceInfo };
        }
        catch (error) {
            return { result: false, errorInf: error };
        }
    }
    async getDeviceInfo(_email, _password, _ipaddr) {
        try {
            await tapo.turnOff(await tapo.loginDeviceByIp(_email, _password, _ipaddr));
            return { result: true };
        }
        catch (error) {
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
    async setTapoTurnOn(_email, _password, _ipaddr) {
        try {
            await tapo.turnOn(await tapo.loginDeviceByIp(_email, _password, _ipaddr));
            return { result: true };
        }
        catch (error) {
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
    async setTapoTurnOff(_email, _password, _ipaddr) {
        try {
            await tapo.turnOff(await tapo.loginDeviceByIp(_email, _password, _ipaddr));
            return { result: true };
        }
        catch (error) {
            return { result: false, errorInf: error };
        }
    }
}
exports.tplinkTapoConnectWrapper = tplinkTapoConnectWrapper;
/* E.O.F */ 
//# sourceMappingURL=tplink_tapo_connect_wrapper.js.map
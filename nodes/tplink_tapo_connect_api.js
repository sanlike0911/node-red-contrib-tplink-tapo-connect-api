"use strict";
// tplinkTapoConnectWrapper
const tplink_tapo_connect_wrapper_1 = require("./tplink_tapo_connect_wrapper/tplink_tapo_connect_wrapper");
const nodeInit = (RED) => {
    /**
     * checkParameter
     *
     * @param {tplinkTapoConnectApiType.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config) {
        let _result = false;
        if (config.email.length > 0 && config.password.length > 0 && (config.deviceIp.length > 0 || config.deviceAlias.length > 0)) {
            _result = true;
        }
        return _result;
    }
    /**
     * tplinkTapoConnectApiConstructor
     *
     * @param {tplinkTapoConnectApiType.appNode} this
     * @param {tplinkTapoConnectApiType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(config) {
        var _a, _b, _c, _d, _e, _f;
        RED.nodes.createNode(this, config);
        let node = this;
        try {
            node.email = (_a = config === null || config === void 0 ? void 0 : config.email) !== null && _a !== void 0 ? _a : "";
            node.password = (_b = config === null || config === void 0 ? void 0 : config.password) !== null && _b !== void 0 ? _b : "";
            node.deviceIp = (_c = config === null || config === void 0 ? void 0 : config.deviceIp) !== null && _c !== void 0 ? _c : "";
            node.deviceAlias = (_d = config === null || config === void 0 ? void 0 : config.deviceAlias) !== null && _d !== void 0 ? _d : "";
            node.deviceIpRange = (_e = config === null || config === void 0 ? void 0 : config.deviceIpRange) !== null && _e !== void 0 ? _e : "";
            node.mode = (_f = config === null || config === void 0 ? void 0 : config.mode) !== null && _f !== void 0 ? _f : "command";
            if (checkParameter(node)) {
                switch (node.mode) {
                    case "command":
                    case "toggle":
                        node.status({ fill: "blue", shape: "dot", text: RED._("resources.message.ready") + `(${node.mode})` });
                        break;
                    default:
                        node.status({ fill: "red", shape: "ring", text: "resources.message.configError" });
                        break;
                }
            }
            else {
                node.status({ fill: "red", shape: "ring", text: "resources.message.configError" });
            }
        }
        catch (error) {
            node.status({ fill: "red", shape: "ring", text: "resources.message.error" });
            node.error(error);
        }
        /**
         * setTapoTurnOff
         *
         * @param {tplinkTapoConnectApiType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOff(config) {
            let ret;
            if (0 < config.deviceIp.length) {
                ret = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOff(config.email, config.password, config.deviceIp);
            }
            else {
                ret = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOffAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
            }
            return ret;
        }
        /**
         * setTapoTurnOn
         *
         * @param {tplinkTapoConnectApiType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOn(config) {
            let ret;
            if (0 < config.deviceIp.length) {
                ret = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOn(config.email, config.password, config.deviceIp);
            }
            else {
                ret = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOnAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
            }
            return ret;
        }
        /**
         * getTapoDeviceInfo
         *
         * @param {tplinkTapoConnectApiType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoDeviceInfoResults >}
         */
        async function getTapoDeviceInfo(config) {
            let ret;
            if (0 < config.deviceIp.length) {
                ret = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().
                    getTapoDeviceInfo(config.email, config.password, config.deviceIp);
            }
            else {
                ret = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().
                    getTapoDeviceInfoAlias(config.email, config.password, config.deviceAlias);
            }
            return ret;
        }
        node.on('input', async (msg) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                // iunput
                let power = Number((_a = msg === null || msg === void 0 ? void 0 : msg.payload) !== null && _a !== void 0 ? _a : -1);
                msg.payload = {};
                // config
                let config = {
                    email: (_b = msg === null || msg === void 0 ? void 0 : msg.email) !== null && _b !== void 0 ? _b : node.email,
                    password: (_c = msg === null || msg === void 0 ? void 0 : msg.password) !== null && _c !== void 0 ? _c : node.password,
                    deviceIp: (_d = msg === null || msg === void 0 ? void 0 : msg.deviceIp) !== null && _d !== void 0 ? _d : node.deviceIp,
                    deviceAlias: (_e = msg === null || msg === void 0 ? void 0 : msg.deviceAlias) !== null && _e !== void 0 ? _e : node.deviceAlias,
                    deviceIpRange: (_f = msg === null || msg === void 0 ? void 0 : msg.deviceIpRange) !== null && _f !== void 0 ? _f : node.deviceIpRange,
                    mode: (_g = msg === null || msg === void 0 ? void 0 : msg.mode) !== null && _g !== void 0 ? _g : node.mode
                };
                let ret = {
                    result: false
                };
                if (checkParameter(config)) {
                    // switch: mode
                    switch (config.mode) {
                        case "command":
                            // mode: command
                            switch (power) {
                                case 0:
                                    ret = await setTapoTurnOff(config);
                                    break;
                                case 1:
                                    ret = await setTapoTurnOn(config);
                                    break;
                                case 255:
                                    ret = await getTapoDeviceInfo(config);
                                    break;
                                default: throw new Error("command not found.");
                            }
                            break;
                        case "toggle":
                            // mode: toggle
                            ret = await getTapoDeviceInfo(config);
                            if (ret.result) {
                                switch ((_h = ret.tapoDeviceInfo) === null || _h === void 0 ? void 0 : _h.device_on) {
                                    case true:
                                        ret = await setTapoTurnOff(config);
                                        break;
                                    case false:
                                        ret = await setTapoTurnOn(config);
                                        break;
                                    default: throw new Error("tapoDeviceInfo.device_on not found.");
                                }
                            }
                            else {
                                throw new Error("faild to get tapo device info.");
                            }
                            break;
                        default:
                            throw new Error("config mode not found.");
                    }
                }
                else {
                    throw new Error("faild to get config.");
                }
                msg.payload = ret;
                node.status({ fill: "green", shape: "dot", text: "resources.message.complete" });
            }
            catch (error) {
                node.status({ fill: "red", shape: "ring", text: "resources.message.communicationError" });
                node.error(error);
                msg.payload = { result: false, errorInf: /*{ name: "Error", message: error}*/ error };
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType('tplink_tapo_connect_api', tplinkTapoConnectApiConstructor);
};
module.exports = nodeInit;
//# sourceMappingURL=tplink_tapo_connect_api.js.map
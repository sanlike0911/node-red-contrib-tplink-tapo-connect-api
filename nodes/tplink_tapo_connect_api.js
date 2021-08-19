"use strict";
const tplink_tapo_connect_wrapper_1 = require("./tplink_tapo_connect_wrapper/tplink_tapo_connect_wrapper");
const nodeInit = (RED) => {
    function checkParameter(config) {
        let _result = false;
        if (config.email.length > 0 && config.password.length > 0 && (config.deviceIp.length > 0 || config.deviceAlias.length > 0)) {
            _result = true;
        }
        return _result;
    }
    function tplinkTapoConnectApiConstructor(config) {
        var _a, _b, _c, _d, _e;
        RED.nodes.createNode(this, config);
        let node = this;
        try {
            node.email = (_a = config === null || config === void 0 ? void 0 : config.email) !== null && _a !== void 0 ? _a : "";
            node.password = (_b = config === null || config === void 0 ? void 0 : config.password) !== null && _b !== void 0 ? _b : "";
            node.deviceIp = (_c = config === null || config === void 0 ? void 0 : config.deviceIp) !== null && _c !== void 0 ? _c : "";
            node.deviceAlias = (_d = config === null || config === void 0 ? void 0 : config.deviceAlias) !== null && _d !== void 0 ? _d : "";
            node.deviceIpRange = (_e = config === null || config === void 0 ? void 0 : config.deviceIpRange) !== null && _e !== void 0 ? _e : "";
            if (checkParameter(node)) {
                node.status({ fill: "blue", shape: "dot", text: "resources.message.ready" });
            }
            else {
                node.status({ fill: "red", shape: "ring", text: "resources.message.configError" });
            }
        }
        catch (error) {
            node.status({ fill: "red", shape: "ring", text: "resources.message.error" });
            node.error(error);
        }
        node.on('input', async (msg) => {
            var _a, _b, _c, _d, _e, _f;
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
                    deviceIpRange: (_f = msg === null || msg === void 0 ? void 0 : msg.deviceIpRange) !== null && _f !== void 0 ? _f : node.deviceIpRange
                };
                let result = {};
                if (checkParameter(config)) {
                    switch (power) {
                        case 0:
                            if (0 < config.deviceIp.length) {
                                result = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().setTapoTurnOff(config.email, config.password, config.deviceIp);
                            }
                            else {
                                result = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().setTapoTurnOffAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
                            }
                            break;
                        case 1:
                            if (0 < config.deviceIp.length) {
                                result = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().setTapoTurnOn(config.email, config.password, config.deviceIp);
                            }
                            else {
                                result = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().setTapoTurnOnAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
                            }
                            break;
                        case 255:
                            if (0 < config.deviceIp.length) {
                                result = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().getTapoDeviceInfo(config.email, config.password, config.deviceIp);
                            }
                            else {
                                result = await tplink_tapo_connect_wrapper_1.tplinkTapoConnectWrapper.getInstance().getTapoDeviceInfoAlias(config.email, config.password, config.deviceAlias);
                            }
                            break;
                        default:
                            result = { "result": "error" };
                            break;
                    }
                }
                else {
                    result = { "result": "error" };
                }
                msg.payload = result;
                node.status({ fill: "green", shape: "dot", text: "resources.message.complete" });
            }
            catch (error) {
                node.status({ fill: "red", shape: "ring", text: "resources.message.communicationError" });
                node.error(error);
                msg.payload = error;
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType('tplink_tapo_connect_api', tplinkTapoConnectApiConstructor);
};
module.exports = nodeInit;
//# sourceMappingURL=tplink_tapo_connect_api.js.map
import { NodeInitializer } from "node-red";

// tplinkTapoConnectApi
import { toggleType } from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType } from "./tplink-tapo-connect/src/wrapper/tplink-tapo-connect-wrapper";

const nodeInit: NodeInitializer = (RED): void => {

    const REGISTER_TYPE: string = 'tplink_toggle';

    /**
     * checkParameter
     *
     * @param {toggleType.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config: toggleType.configBase): boolean {
        let _result: boolean = false;
        if (config?.email.length > 0 && config?.password.length > 0 && config?.deviceIp.length > 0) {
            _result = true;
        }
        return _result
    }

    /**
     * tplinkTapoConnectApiConstructor
     *
     * @param {any} this
     * @param {toggleType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: any,
        config: toggleType.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: toggleType.appNode = this;

        try {
            node.email = this?.credentials?.email ?? "";
            node.password = this?.credentials?.password ?? "";
            node.deviceIp = config?.deviceIp ?? "";
        } catch (error) {
            node.status({ fill: "red", shape: "ring", text: "resources.message.error" });
            node.error(error);
        }


        /**
         * setTapoTurnOff
         *
         * @param {toggleType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOff(config: toggleType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
            return await tplinkTapoConnectWrapper.getInstance().
                setTapoTurnOff(config.email, config.password, config.deviceIp);
        }

        /**
         * setTapoTurnOn
         *
         * @param {toggleType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOn(config: toggleType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
            return await tplinkTapoConnectWrapper.getInstance().
                setTapoTurnOn(config.email, config.password, config.deviceIp);
        }

        /**
         * getTapoDeviceInfo
         *
         * @param {toggleType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoDeviceInfoResults >}
         */
        async function getTapoDeviceInfo(config: toggleType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
            return await tplinkTapoConnectWrapper.getInstance().
                getTapoDeviceInfo(config.email, config.password, config.deviceIp);
        }

        node.on('input', async (msg: any) => {
            try {

                // config
                let config: toggleType.configBase = {
                    email: msg.payload?.email ?? node.email,
                    password: msg.payload?.password ?? node.password,
                    deviceIp: msg.payload?.deviceIp ?? node.deviceIp
                };
                // debug (セキュリティ上、認証情報を除外)
                console.log(`config[${REGISTER_TYPE}]:`, {
                    deviceIp: config.deviceIp,
                    email: config.email ? '[REDACTED]' : '',
                    password: config.password ? '[REDACTED]' : ''
                });
                // debug

                let ret: tplinkTapoConnectWrapperType.tapoConnectResults = {
                    result: false
                };

                if (checkParameter(config)) {
                    // node: toggle
                    ret = await getTapoDeviceInfo(config);
                    if (ret.result) {
                        // Keep the original deviceIp since deviceId is not an IP address
                        node.status({ fill: "yellow", shape: "dot", text: "resources.message.processing" });
                        
                        // device statusをコンソールログに出力
                        const deviceStatus = ret.tapoDeviceInfo?.device_on ? "ON" : "OFF";
                        console.log(`[${REGISTER_TYPE}] device status: ${deviceStatus} (IP: ${config.deviceIp})`);
                        
                        // device on/off?
                        switch (ret.tapoDeviceInfo?.device_on) {
                            case true:
                                ret = await setTapoTurnOff(config);
                                break;
                            case false:
                                ret = await setTapoTurnOn(config);
                                break;
                            default: throw new Error("tapoDeviceInfo.device_on not found.");
                        }
                    } else {
                        if (ret?.errorInf) {
                            throw new Error(ret.errorInf.message);
                        }
                        throw new Error("faild to get tapo device info.");
                    }
                } else {
                    throw new Error("faild to get config.");
                }
                msg.payload = ret;
                node.status({ fill: "green", shape: "dot", text: "resources.message.complete" });
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: "resources.message.communicationError" });
                node.error(error);
                msg.payload = { result: false, errorInf: error };
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType(REGISTER_TYPE, tplinkTapoConnectApiConstructor, {
        credentials: {
            email: { type:"text" },
            password: { type:"password" }
        }
    });
};

export = nodeInit;

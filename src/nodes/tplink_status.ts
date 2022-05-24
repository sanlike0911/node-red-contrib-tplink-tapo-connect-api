import { NodeInitializer } from "node-red";
// debug 
import * as tapoConfig from 'config';

// tplinkTapoConnectApi
import { statusType } from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType } from "./tplink_tapo_connect_wrapper/tplink_tapo_connect_wrapper";

const nodeInit: NodeInitializer = (RED): void => {

    const REGISTER_TYPE: string = 'tplink_status';

    /**
     * checkParameter
     *
     * @param {toggleType.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config: statusType.configBase): boolean {
        let _result: boolean = false;
        if (config?.email.length > 0 && config?.password.length > 0) {
            if (('ip' === config?.searchMode && config?.deviceIp.length > 0) ||
                ('alias' === config?.searchMode && config?.deviceAlias.length > 0 && config?.deviceIpRange.length > 0)) {
                _result = true;
            }
        }
        return _result
    }

    /**
     * tplinkTapoConnectApiConstructor
     *
     * @param {any} this
     * @param {statusType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: any,
        config: statusType.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: statusType.appNode = this;

        try {
            node.email = this?.credentials?.email ?? "";
            node.password = this?.credentials?.password ?? "";
            node.deviceIp = config?.deviceIp ?? "";
            node.deviceAlias = config?.deviceAlias ?? "";
            node.deviceIpRange = config?.deviceIpRange ?? "";
            node.searchMode = config?.searchMode ?? "ip";
        } catch (error) {
            node.status({ fill: "red", shape: "ring", text: "resources.message.error" });
            node.error(error);
        }

        /**
         * getTapoDeviceInfo
         *
         * @param {statusType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoDeviceInfoResults >}
         */
        async function getTapoDeviceInfo(config: statusType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
            let ret: tplinkTapoConnectWrapperType.tapoConnectResults;
            if ("ip" === config.searchMode) {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    getTapoDeviceInfo(config.email, config.password, config.deviceIp);
            } else {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    getTapoDeviceInfoAlias(config.email, config.password, config.deviceAlias);
            }
            return ret;
        }

        node.on('input', async (msg: any) => {
            try {

                // config
                let config: statusType.configBase = {
                    email: msg.payload?.email ?? node.email,
                    password: msg.payload?.password ?? node.password,
                    deviceIp: msg.payload?.deviceIp ?? node.deviceIp,
                    deviceAlias: msg.payload?.deviceAlias ?? node.deviceAlias,
                    deviceIpRange: msg.payload?.deviceIpRange ?? node.deviceIpRange,
                    searchMode: msg.payload?.searchMode ?? node.searchMode
                };
                // debug
                console.log(`config-${REGISTER_TYPE}:`, config);
                const _tapoConfig: any = tapoConfig;
                if ( typeof _tapoConfig.tapoSettings !== 'undefined' ){
                    if (false === checkParameter(config)){
                        config = _tapoConfig.tapoSettings;
                        console.log("Updated to debug settings.");
                        console.log(`config-${REGISTER_TYPE}:`, config);
                    }
                }
                // debug

                let ret: tplinkTapoConnectWrapperType.tapoConnectResults = {
                    result: false
                };

                if (checkParameter(config)) {
                    // node: status
                    ret = await getTapoDeviceInfo(config);
                } else {
                    throw new Error("faild to get config.");
                }
                msg.payload = ret;
                node.status({ fill: "green", shape: "dot", text: "resources.message.complete" });
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: "resources.message.communicationError" });
                node.error(error);
                msg.payload = { result: false, errorInf: /*{ name: "Error", message: error}*/error };
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

import { NodeInitializer } from "node-red";

// tplinkTapoConnectApi
import { toggleType } from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType } from "./tplink_tapo_connect_wrapper/tplink_tapo_connect_wrapper";

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
     * @param {toggleType.appNode} this
     * @param {toggleType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: toggleType.appNode,
        config: toggleType.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: toggleType.appNode = this;

        try {
            node.email = config?.email ?? "";
            node.password = config?.password ?? "";
            node.deviceIp = config?.deviceIp ?? "";
            node.deviceAlias = config?.deviceAlias ?? "";
            node.deviceIpRange = config?.deviceIpRange ?? "";
            node.searchMode = config?.searchMode ?? "ip";
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
            let ret: tplinkTapoConnectWrapperType.tapoConnectResults;
            if ("ip" === config.searchMode) {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOff(config.email, config.password, config.deviceIp);
            } else {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOffAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
            }
            return ret;
        }

        /**
         * setTapoTurnOn
         *
         * @param {toggleType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOn(config: toggleType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
            let ret: tplinkTapoConnectWrapperType.tapoConnectResults;
            if ("ip" === config.searchMode) {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOn(config.email, config.password, config.deviceIp);
            } else {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    setTapoTurnOnAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
            }
            return ret;
        }

        /**
         * getTapoDeviceInfo
         *
         * @param {toggleType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoDeviceInfoResults >}
         */
        async function getTapoDeviceInfo(config: toggleType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
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
                let config: toggleType.configBase = {
                    email: msg.payload?.email ?? node.email,
                    password: msg.payload?.password ?? node.password,
                    deviceIp: msg.payload?.deviceIp ?? node.deviceIp,
                    deviceAlias: msg.payload?.deviceAlias ?? node.deviceAlias,
                    deviceIpRange: msg.payload?.deviceIpRange ?? node.deviceIpRange,
                    searchMode: msg.payload?.searchMode ?? node.searchMode
                };
                // debug
                console.log(`config[${REGISTER_TYPE}]:`, config);
                // debug

                let ret: tplinkTapoConnectWrapperType.tapoConnectResults = {
                    result: false
                };

                if (checkParameter(config)) {
                    // node: toggle
                    ret = await getTapoDeviceInfo(config);
                    if (ret.result) {
                        // update
                        config.searchMode = 'ip';
                        config.deviceIp = ret.tapoDeviceInfo?.ip ?? config.deviceIp;
                        config.deviceAlias = ret.tapoDeviceInfo?.nickname ?? config.deviceAlias;
                        // device on/off?
                        switch (ret.tapoDeviceInfo?.device_on) {
                            case true: ret = await setTapoTurnOff(config); break;
                            case false: ret = await setTapoTurnOn(config); break;
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
    RED.nodes.registerType(REGISTER_TYPE, tplinkTapoConnectApiConstructor);
};

export = nodeInit;

import { NodeInitializer } from "node-red";

// tplinkTapoConnectApi
import { turnOnType } from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType } from "./tplink-tapo-connect/wrapper/tplink-tapo-connect-wrapper";

const nodeInit: NodeInitializer = (RED): void => {

    const REGISTER_TYPE: string = 'tplink_turn_on';

    /**
     * checkParameter
     *
     * @param {turnOnType.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config: turnOnType.configBase): boolean {
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
     * @param {turnOnType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: any,
        config: turnOnType.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: turnOnType.appNode = this;

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
         * setTapoTurnOn
         *
         * @param {turnOnType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOn(config: turnOnType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
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

        node.on('input', async (msg: any) => {
            try {

                // config
                let config: turnOnType.configBase = {
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
                    // node: turn_on
                    node.status({ fill: "yellow", shape: "dot", text: "resources.message.processing" });
                    ret = await setTapoTurnOn(config);
                } else {
                    if (ret?.errorInf) {
                        throw new Error(ret.errorInf.message);
                    }
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

import { NodeInitializer } from "node-red";

// tplinkTapoConnectApi
import { customRequstType } from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType } from "./tplink_tapo_connect_wrapper/tplink_tapo_connect_wrapper";

const nodeInit: NodeInitializer = (RED): void => {

    const REGISTER_TYPE: string = 'tplink_custom_request';

    /**
     * checkParameter
     *
     * @param {toggleType.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config: customRequstType.configBase): boolean {
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
     * @param {customRequstType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: any,
        config: customRequstType.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: customRequstType.appNode = this;

        try {
            node.email = this?.credentials?.email ?? "";
            node.password = this?.credentials?.password ?? "";
            node.deviceIp = config?.deviceIp ?? "";
            node.deviceAlias = config?.deviceAlias ?? "";
            node.deviceIpRange = config?.deviceIpRange ?? "";
            node.searchMode = config?.searchMode ?? "ip";
            node.method = config?.method ?? "";
            node.securePassthrough = config?.securePassthrough ?? "true";
            node.params = config?.params  ?? "";

            // if(checkParameter(node)){
            //     switch(node.command){
            //         case 0:
            //         case 1:
            //             node.status({fill:"blue", shape:"dot", text:RED._("resources.message.ready") + `(${node.command})` });
            //             break;
            //         default:
            //             node.status({fill:"red", shape:"ring", text:"resources.message.configError"});
            //             break;
            //     }
            // } else {
            //     node.status({fill:"red", shape:"ring", text:"resources.message.configError"});
            // }
        } catch (error) {
            node.status({ fill: "red", shape: "ring", text: "resources.message.error" });
            node.error(error);
        }

        /**
         * sendTapoCustomRequest
         *
         * @param {customRequstType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoCustomRequest >}
         */
        async function sendTapoCustomRequest(config: customRequstType.configBase): Promise<tplinkTapoConnectWrapperType.tapoCustomRequest> {
            let ret: tplinkTapoConnectWrapperType.tapoCustomRequest;
            if ("ip" === config.searchMode) {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    sendCustomRequest(config.email, config.password, config.deviceIp, config.method, config.params, config.securePassthrough);
            } else {
                ret = await tplinkTapoConnectWrapper.getInstance().
                    sendCustomRequestAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange, config.method, config.params, config.securePassthrough);
            }
            return ret;
        }


        node.on('input', async (msg: any) => {
            try {

                // config
                let config: customRequstType.configBase = {
                    email: msg.payload?.email ?? node.email,
                    password: msg.payload?.password ?? node.password,
                    deviceIp: msg.payload?.deviceIp ?? node.deviceIp,
                    deviceAlias: msg.payload?.deviceAlias ?? node.deviceAlias,
                    deviceIpRange: msg.payload?.deviceIpRange ?? node.deviceIpRange,
                    searchMode: msg.payload?.searchMode ?? node.searchMode,
                    method: msg.payload?.method ?? node.method,
                    securePassthrough:msg.payload?.securePassthrough?.method ?? node.securePassthrough,
                    params: msg.payload?.params ?? node.params
                };
                // debug
                console.log(`config[${REGISTER_TYPE}]:`, config);
                // debug

                let ret: tplinkTapoConnectWrapperType.tapoCustomRequest = {
                    success: false
                };

                if (checkParameter(config)) {
                    ret = await sendTapoCustomRequest(config);
                    msg.errorCode = ret.errorCode;
                    msg.request = ret.requestData;
                    msg.debug = ret;
                    if (ret.success) {
                        msg.payload = ret.result;
                    } else {
                        if (ret?.errorCode) {
                            throw new Error(ret.result);
                        }
                        throw new Error("faild to send custom command");
                    }
                } else {
                    throw new Error("faild to get config.");
                }
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

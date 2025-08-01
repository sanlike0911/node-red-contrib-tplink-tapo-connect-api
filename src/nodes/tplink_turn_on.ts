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
        if (config?.email.length > 0 && config?.password.length > 0 && config?.deviceIp.length > 0) {
            _result = true;
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
            return await tplinkTapoConnectWrapper.getInstance().
                setTapoTurnOn(config.email, config.password, config.deviceIp);
        }

        node.on('input', async (msg: any) => {
            try {

                // config
                let config: turnOnType.configBase = {
                    email: msg.payload?.email ?? node.email,
                    password: msg.payload?.password ?? node.password,
                    deviceIp: msg.payload?.deviceIp ?? node.deviceIp
                };
                // debug
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

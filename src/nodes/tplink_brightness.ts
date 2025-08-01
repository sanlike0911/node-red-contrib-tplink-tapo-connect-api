import { NodeInitializer } from "node-red";

// tplinkTapoConnectApi
import { brightnessType } from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType } from "./tplink-tapo-connect/wrapper/tplink-tapo-connect-wrapper";

const nodeInit: NodeInitializer = (RED): void => {

    const REGISTER_TYPE: string = 'tplink_brightness';

    /**
     * checkParameter
     *
     * @param {brightnessType.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config: brightnessType.configBase): boolean {
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
     * @param {brightnessType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: any,
        config: brightnessType.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: brightnessType.appNode = this;

        try {
            node.email = this?.credentials?.email ?? "";
            node.password = this?.credentials?.password ?? "";
            node.deviceIp = config?.deviceIp ?? "";
            node.brightness = config?.brightness ?? 0;
        } catch (error) {
            node.status({ fill: "red", shape: "ring", text: "resources.message.error" });
            node.error(error);
        }

        /**
         *
         *
         * @param {brightnessType.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoBrightness(config: brightnessType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
            return await tplinkTapoConnectWrapper.getInstance().
                setTapoBrightness(config.email, config.password, config.deviceIp, config.brightness);
        }

        node.on('input', async (msg: any) => {
            try {

                // config
                let config: brightnessType.configBase = {
                    email: msg.payload?.email ?? node.email,
                    password: msg.payload?.password ?? node.password,
                    deviceIp: msg.payload?.deviceIp ?? node.deviceIp,
                    brightness: msg.payload?.brightness ?? node.brightness
                };
                // debug
                console.log(`config[${REGISTER_TYPE}]:`, {
                    deviceIp: config.deviceIp,
                    brightness: config.brightness,
                    email: config.email ? '[REDACTED]' : '',
                    password: config.password ? '[REDACTED]' : ''
                });
                // debug

                let ret: tplinkTapoConnectWrapperType.tapoConnectResults = {
                    result: false
                };

                if (checkParameter(config)) {
                    // node: brightness
                    node.status({ fill: "yellow", shape: "dot", text: "resources.message.processing" });
                    ret = await setTapoBrightness(config);
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

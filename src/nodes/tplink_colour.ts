import { NodeInitializer } from "node-red";

// tplinkTapoConnectApi
import { colourType } from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType } from "./tplink-tapo-connect/wrapper/tplink-tapo-connect-wrapper";

const nodeInit: NodeInitializer = (RED): void => {

    const REGISTER_TYPE: string = 'tplink_colour';

    /**
     * checkParameter
     *
     * @param {colourType.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config: colourType.configBase): boolean {
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
     * @param {colourType.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: any,
        config: colourType.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: colourType.appNode = this;

        try {
            node.email = this?.credentials?.email ?? "";
            node.password = this?.credentials?.password ?? "";
            node.deviceIp = config?.deviceIp ?? "";
            node.colour = config?.colour ?? "";
        } catch (error) {
            node.status({ fill: "red", shape: "ring", text: "resources.message.error" });
            node.error(error);
        }

        /**
         *
         *
         * @param {colourType.configBase} config
         * @param {string} colour
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoColour(config: colourType.configBase): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
            return await tplinkTapoConnectWrapper.getInstance().
                setTapoColour(config.email, config.password, config.deviceIp, config.colour);
        }

        node.on('input', async (msg: any) => {
            try {

                // config
                let config: colourType.configBase = {
                    email: msg.payload?.email ?? node.email,
                    password: msg.payload?.password ?? node.password,
                    deviceIp: msg.payload?.deviceIp ?? node.deviceIp,
                    colour: msg.payload?.colour ?? node.colour
                };
                // debug
                console.log(`config[${REGISTER_TYPE}]:`, {
                    deviceIp: config.deviceIp,
                    colour: config.colour,
                    email: config.email ? '[REDACTED]' : '',
                    password: config.password ? '[REDACTED]' : ''
                });
                // debug

                let ret: tplinkTapoConnectWrapperType.tapoConnectResults = {
                    result: false
                };

                if (checkParameter(config)) {
                    // node: color
                    node.status({ fill: "yellow", shape: "dot", text: "resources.message.processing" });
                    ret = await setTapoColour(config);
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

import { NodeInitializer } from "node-red";

// tplinkTapoConnectApi
import tplinkTapoConnect from "./type";

// tplinkTapoConnectWrapper
import { tplinkTapoConnectWrapper } from "./tplink_tapo_connect_wrapper/tplink_tapo_connect_wrapper";
import tplinkTapoConnectWrapperType  from "./tplink_tapo_connect_wrapper/type";

const nodeInit: NodeInitializer = (RED): void => {

    /**
     * checkParameter
     *
     * @param {tplinkTapoConnect.configBase} config
     * @returns {boolean}
     */
    function checkParameter(config: tplinkTapoConnect.configBase ): boolean {
        let _result: boolean = false;
        if(config.email.length > 0 && config.password.length > 0 && (config.deviceIp.length > 0 || config.deviceAlias.length > 0) ){
            _result = true;
        }
        return _result
    }

    /**
     * tplinkTapoConnectApiConstructor
     *
     * @param {tplinkTapoConnect.appNode} this
     * @param {tplinkTapoConnect.appNodeDef} config
     */
    function tplinkTapoConnectApiConstructor(
        this: tplinkTapoConnect.appNode,
        config: tplinkTapoConnect.appNodeDef
    ): void {
        RED.nodes.createNode(this, config);
        let node: tplinkTapoConnect.appNode = this;

        try {
            node.email = config?.email ?? "";
            node.password = config?.password ?? "";
            node.deviceIp = config?.deviceIp ?? "";
            node.deviceAlias = config?.deviceAlias ?? "";
            node.deviceIpRange = config?.deviceIpRange ?? "";
            node.mode = config?.mode ?? "command";

            if(checkParameter(node)){
                switch(node.mode){
                    case "command":
                    case "toggle":
                        node.status({fill:"blue", shape:"dot", text:RED._("resources.message.ready") + `(${node.mode})` });
                        break;
                    default:
                        node.status({fill:"red", shape:"ring", text:"resources.message.configError"});
                        break;
                }
            } else {
                node.status({fill:"red", shape:"ring", text:"resources.message.configError"});
            }
        } catch (error) {
            node.status({fill:"red", shape:"ring", text:"resources.message.error"});
            node.error(error);
        }


        /**
         * setTapoTurnOff
         *
         * @param {tplinkTapoConnect.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOff(config: tplinkTapoConnect.configBase): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
            let ret: tplinkTapoConnectWrapperType.tapoConnectResults;
            if( 0 < config.deviceIp.length ){
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
         * @param {tplinkTapoConnect.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
         */
        async function setTapoTurnOn(config: tplinkTapoConnect.configBase): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
            let ret: tplinkTapoConnectWrapperType.tapoConnectResults;
            if( 0 < config.deviceIp.length ){
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
         * @param {tplinkTapoConnect.configBase} config
         * @returns {Promise< tplinkTapoConnectWrapperType.tapoDeviceInfoResults >}
         */
        async function getTapoDeviceInfo(config: tplinkTapoConnect.configBase): Promise< tplinkTapoConnectWrapperType.tapoConnectResults > {
            let ret: tplinkTapoConnectWrapperType.tapoConnectResults;
            if( 0 < config.deviceIp.length ){
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
                // iunput
                let power: number = Number(msg?.payload ?? -1);
                msg.payload = {};

                // config
                let config: tplinkTapoConnect.configBase = {
                    email: msg?.email ?? node.email,
                    password: msg?.password ?? node.password,
                    deviceIp: msg?.deviceIp ?? node.deviceIp,
                    deviceAlias: msg?.deviceAlias ?? node.deviceAlias,
                    deviceIpRange: msg?.deviceIpRange ?? node.deviceIpRange,
                    mode: msg?.mode ?? node.mode
                };

                let ret: tplinkTapoConnectWrapperType.tapoConnectResults = {
                    result: false
                };

                if(checkParameter(config)){
                    // switch: mode
                    switch(config.mode){
                    case "command":
                        // mode: command
                        switch(power){
                            case   0: ret = await setTapoTurnOff(config);       break;
                            case   1: ret = await setTapoTurnOn(config);        break;
                            case 255: ret = await getTapoDeviceInfo(config);    break;
                            default: throw new Error("command not found.");
                        }
                        break;
                    case "toggle":
                        // mode: toggle
                        ret = await getTapoDeviceInfo(config);
                        if( ret.result ){
                            switch(ret.tapoDeviceInfo?.device_on){
                                case true:  ret = await setTapoTurnOff(config);             break;
                                case false: ret = await setTapoTurnOn(config);              break;
                                default:    throw new Error("tapoDeviceInfo.device_on not found.");
                            }
                        } else {
                            throw new Error("faild to get tapo device info.");
                        }
                        break;
                    default:
                        throw new Error("config mode not found.");
                    }
                } else {
                    throw new Error("faild to get config.");
                }
                msg.payload = ret;
                node.status({fill:"green", shape:"dot", text:"resources.message.complete"});
            } catch (error) {
                node.status({fill:"red", shape:"ring", text:"resources.message.communicationError"});
                node.error(error);
                msg.payload = { result: false, errorInf: /*{ name: "Error", message: error}*/error };
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType('tplink_tapo_connect_api', tplinkTapoConnectApiConstructor);
};

export = nodeInit;

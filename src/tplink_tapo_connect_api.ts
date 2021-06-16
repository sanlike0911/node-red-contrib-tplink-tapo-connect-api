import { NodeInitializer } from "node-red";
import tplinkTapoConnect from "./type";

import { tplinkTapoConnectWrapper } from "./tplink_tapo_connect_wrapper/tplink_tapo_connect_wrapper";

const nodeInit: NodeInitializer = (RED): void => {

    function checkParameter(config: tplinkTapoConnect.configBase ): boolean {
        let _result: boolean = false;
        if(config.email.length > 0 && config.password.length > 0 && (config.deviceIp.length > 0 || config.deviceAlias.length > 0) ){
            _result = true;
        }
        return _result
    }

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

            if(checkParameter(node)){
                node.status({fill:"blue", shape:"dot", text:"resources.message.ready"});
            } else {
                node.status({fill:"red", shape:"ring", text:"resources.message.configError"});
            }
        } catch (error) {
            node.status({fill:"red", shape:"ring", text:"resources.message.error"});
            node.error(error);
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
                    deviceIpRange: msg?.deviceIpRange ?? node.deviceIpRange
                };

                let result: object = {};

                if(checkParameter(config)){
                    switch(power){
                    case 0:
                        if( 0 < config.deviceIp.length ){
                            result = await tplinkTapoConnectWrapper.getInstance().setTapoTurnOff(config.email, config.password, config.deviceIp);
                        } else {
                            result = await tplinkTapoConnectWrapper.getInstance().setTapoTurnOffAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
                        }
                        break;
                    case 1:
                        if( 0 < config.deviceIp.length ){
                            result = await tplinkTapoConnectWrapper.getInstance().setTapoTurnOn(config.email, config.password, config.deviceIp);
                        } else {
                            result = await tplinkTapoConnectWrapper.getInstance().setTapoTurnOnAlias(config.email, config.password, config.deviceAlias, config.deviceIpRange);
                        }
                        break;
                    default:
                        result = { "result":"error" };
                        break;
                    }
                } else {
                    result = { "result":"error" };
                }
                msg.payload = result;
                node.status({fill:"green", shape:"dot", text:"resources.message.complete"});
            } catch (error) {
                node.status({fill:"red", shape:"ring", text:"resources.message.communicationError"});
                node.error(error);
                msg.payload = error;
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType('tplink_tapo_connect_api', tplinkTapoConnectApiConstructor);
};

export = nodeInit;

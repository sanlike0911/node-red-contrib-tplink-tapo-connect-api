import { Node, NodeDef } from "node-red";

declare namespace tplinkTapoConnectApi {

    type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;
    }

    type tapoDeviceKey = {

        key: Buffer;

        iv: Buffer;

        deviceIp: string;

        sessionCookie: string;

        token?: string;
    }

    type tapoConnectResults = {

        result: boolean;
      
        errorInf?: Error;
      
    }

    type nodeRedMsgBase = {

        _msgid?: string;

        payload: any;

        topic?: string;
    }

    // interface inputMessage extends nodeRedMsgBase, requestQueryParameters {}
    interface appNodeDef extends NodeDef, configBase {}
    interface appNode extends Node, configBase {}
}

export default tplinkTapoConnectApi;
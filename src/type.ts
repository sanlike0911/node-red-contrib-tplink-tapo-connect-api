import { Node, NodeDef } from "node-red";

export namespace tplinkTapoConnectApiType {

    export type modeTypes = "command" | "toggle";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        mode : modeTypes;
    }

    export type nodeRedMsgBase = {

        _msgid?: string;

        payload: any;

        topic?: string;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}
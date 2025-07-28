import { Node, NodeDef } from "node-red";

/* This "node module: tplink_tapo_connect_api" has been left for compatibility, this module may be deleted without notice. */
export namespace tplinkTapoConnectApiType {

    export type modeTypes = "command" | "toggle";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        mode : modeTypes;

    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace brightnessType {

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        brightness: number;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace colourType {
    
    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        colour: string;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace commandType {

    export type commandTypes = "" | "power" | "toggle" | "status";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        command: commandTypes;

        option: {

            power?: number;

        };
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace customRequstType {

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        method: string;
        
        securePassthrough: string;
        
        params: string;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace statusType {

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace toggleType {

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace turnOffType {

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace turnOnType {

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}
import { Node, NodeDef } from "node-red";

/* This "node module: tplink_tapo_connect_api" has been left for compatibility, this module may be deleted without notice. */
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

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace brightnessType {

    export type searchModeTypes = "ip" | "alias";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        brightness: number;

        searchMode : searchModeTypes;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace colourType {

    export type searchModeTypes = "ip" | "alias";
    
    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        colour: string;

        searchMode : searchModeTypes;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace commandType {

    export type searchModeTypes = "ip" | "alias";

    export type commandTypes = "" | "power" | "toggle" | "status";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        command: commandTypes;

        option: {

            power?: number;

        };

        searchMode : searchModeTypes;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace statusType {

    export type searchModeTypes = "ip" | "alias";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        searchMode : searchModeTypes;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace toggleType {

    export type searchModeTypes = "ip" | "alias";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        searchMode : searchModeTypes;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace turnOffType {

    export type searchModeTypes = "ip" | "alias";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        searchMode : searchModeTypes;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}

export namespace turnOnType {

    export type searchModeTypes = "ip" | "alias";

    export type configBase = {

        email: string;

        password: string;

        deviceIp: string;

        deviceAlias: string;

        deviceIpRange: string;

        searchMode : searchModeTypes;
    }

    export interface appNodeDef extends NodeDef, configBase {}
    export interface appNode extends Node, configBase {}

}
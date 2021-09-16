# node-red-contrib-tplink-tapo-connect-api

Unofficial node-RED node for connecting to TP-Link Tapo devices. Currently limited to the P100 & P105 smart plugs and L510E smart bulbs.

![node](./figs/sample00.png)

## nodes

- toggle

    ![node-command](figs/node-toggle.png)

    This node module provides the ability to toggle (on / off) the power of tapo smart plugs.

- turn-on

    ![node-command](figs/node-turn-on.png)

    This node module provides the ability to power on tapo smart plugs.

- turn-off

    ![node-command](figs/node-turn-off.png)

    This node module provides the ability to power off tapo smart plugs.

- brightness

    ![node-brightness](figs/node-brightness.png)

    This node module provides the ability to set the brightness of tapo smart bulbs.

- colour

    ![node-command](figs/node-colour.png)

    This node module provides the ability to set the color of tapo smart bulbs.

- command

    ![node-command](figs/node-command.png)

    This node module provides several features by input `"msg.payload.command"`.

    1. power

        tapo device power on/off

        `msg.payload.option`

        ```cmd
        0: tapo device power off
        1: tapo device power on
        ```

    2. toggle

        tapo device power on/off(toggle)

    3. status

        get tapo device info

- status

    ![node-command](figs/node-status.png)

    This node module provides the ability to get the device infomation of tapo smart plugs.

    Get the device information from `"output: msg.payload.tapoDeviceInfo"`.

- tplink_tapo_connect_api(`deprecated`)

    ![node-command](figs/tplink_tapo_connect_api.png)

    This "node module: tplink_tapo_connect_api" has been left for compatibility, this module may be deleted without notice.

## Pre-requisites

The node-red-contrib-tplink-tapo-connect-api requires `Node-RED 1.00` to be installed.

## Install

```cmd
npm install node-red-contrib-tplink-tapo-connect-api
```

## Usage

- Properties

  ![config](./figs/sample01.png)

  - Name

    Set the node name displayed in the flow.

  - Email

    Set the email address registered with Tp Link.

  - Password

    Set the password registered with Tp Link.

  - Search mode

    Select a search mode for the tapo device.

    [Usage]
    - ip : search by ip. (It's fast.)
    - alias: search by alias and ip range.

  - Tapo ipaddress(`selected: ip`)

    Set the IP address to the Tapo device.

  - Tapo alias(`selected: alias`)

    set the tapo device alias registered with Tp Link.

  - Tapo find ip range(`selected: alias`)

    set the IP range to search for Tapo device.

    [Usage]
    - case1: "192.168.0.1 to 192.168.0.25"
    - case2: "192.168.0.0/24"

### Inputs

`msg.payload`

```typescript
type searchModeTypes = "ip" | "alias";
type commandTypes = "" | "power" | "toggle" | "status";

type payload {
    email: string;
    password: string;
    deviceIp: string;
    deviceAlias: string;
    deviceIpRange: string;
    searchMode : searchModeTypes;
    command: commandTypes;          /* "node-command" only */
    option: {                       /* "node-command" only */
        power?: number;
    };
    colour: string;                 /* "node-colour" only */
    brightness: numbar;             /* "node-brightness" only */
}
```

[example1]

```json
msg = {
  "email": "your@gmail.com",
  "password": "password",
  "deviceIp": "192.168.0.xxx",
  "command": "power",
  "option": {
    "power": 0
  }
}
```

[example2]

```json
msg = {
  "email": "your@gmail.com",
  "password": "password",
  "deviceIp": "192.168.0.xxx",
  "command": "toggle"
}
```

### Outputs

The processing result is passed by msg.payload. It consists of an object that contains the following properties:

```typescript
type tapoConnectResults = {
    result: boolean; /* true: success, false: failure */
    tapoDeviceInfo?: tapoDeviceInfo; /* smart plug device infomation */
    errorInf?: Error;
}
```

[smart plug device infomation]

You can tell if the device is on or off by getting "device_on".

```text
true: smart plug power on
false: smart plug power off
```

```javascript
{
    result: true,
    tapoDeviceInfo: {
    device_id: "*************"
    fw_ver: "1.2.10 Build 20200609 Rel. 33394"
    hw_ver: "1.0.0"
    type: "SMART.TAPOPLUG"
    model: "P105"
    mac: "XX-XX-XX-XX-XX-XX"
    hw_id: "*************"
    fw_id: "*************"
    oem_id: "*************"
    specs: "JP"
    device_on: false
    on_time: 0
    overheated: false
    nickname: "3d printer power supply"
    location: "XXXXXXXXXXXXXXXX"
    avatar: "plug"
    time_usage_today: 0
    time_usage_past7: 0
    time_usage_past30: 0
    longitude: 0
    latitude: 0
    has_set_location_info: true
    ip: "192.168.0.XXX"
    ssid: "SSID"
    signal_level: 0
    rssi: 0
    region: "Asia/Tokyo"
    time_diff: 0
    lang: "ja_JP"
    }
}
```

### example

```json
[
    {
        "id": "01ccda01ada3740d",
        "type": "group",
        "z": "35250d14.0fb0b2",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "9688311d857cbbd4",
            "13d4a967f251539e",
            "d93c8ed65cee8445",
            "41d054e7f0db6c7d"
        ],
        "x": 34,
        "y": 19,
        "w": 652,
        "h": 142
    },
    {
        "id": "9688311d857cbbd4",
        "type": "debug",
        "z": "35250d14.0fb0b2",
        "g": "01ccda01ada3740d",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 570,
        "y": 120,
        "wires": []
    },
    {
        "id": "13d4a967f251539e",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "01ccda01ada3740d",
        "name": "",
        "props": [],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 190,
        "y": 120,
        "wires": [
            [
                "41d054e7f0db6c7d"
            ]
        ]
    },
    {
        "id": "d93c8ed65cee8445",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "01ccda01ada3740d",
        "name": "[node-turn-off]",
        "info": "",
        "x": 130,
        "y": 60,
        "wires": []
    },
    {
        "id": "41d054e7f0db6c7d",
        "type": "tplink_turn_off",
        "z": "35250d14.0fb0b2",
        "g": "01ccda01ada3740d",
        "name": "",
        "email": "your-email@gmail.com",
        "password": "password",
        "deviceIp": "",
        "deviceAlias": "",
        "deviceIpRange": "",
        "searchMode": "ip",
        "x": 380,
        "y": 120,
        "wires": [
            [
                "9688311d857cbbd4"
            ]
        ]
    },
    {
        "id": "06b6360f81296af7",
        "type": "group",
        "z": "35250d14.0fb0b2",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "2ee76b9b2c3cc22d",
            "c76158138c91c20f",
            "99d557cc9c7c0fe5",
            "6e0f6bd8b59f15b8",
            "1d16de9bc2fc9db5"
        ],
        "x": 34,
        "y": 379,
        "w": 652,
        "h": 202
    },
    {
        "id": "2ee76b9b2c3cc22d",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "06b6360f81296af7",
        "name": "100",
        "props": [
            {
                "p": "brightness",
                "v": "100",
                "vt": "num"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 190,
        "y": 540,
        "wires": [
            [
                "1d16de9bc2fc9db5"
            ]
        ]
    },
    {
        "id": "c76158138c91c20f",
        "type": "debug",
        "z": "35250d14.0fb0b2",
        "g": "06b6360f81296af7",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 570,
        "y": 480,
        "wires": []
    },
    {
        "id": "99d557cc9c7c0fe5",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "06b6360f81296af7",
        "name": "0",
        "props": [
            {
                "p": "brightness",
                "v": "0",
                "vt": "num"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 190,
        "y": 480,
        "wires": [
            [
                "1d16de9bc2fc9db5"
            ]
        ]
    },
    {
        "id": "6e0f6bd8b59f15b8",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "06b6360f81296af7",
        "name": "[node-brightness]",
        "info": "",
        "x": 140,
        "y": 420,
        "wires": []
    },
    {
        "id": "1d16de9bc2fc9db5",
        "type": "tplink_brightness",
        "z": "35250d14.0fb0b2",
        "g": "06b6360f81296af7",
        "name": "",
        "email": "your-email@gmail.com",
        "password": "password",
        "deviceIp": "",
        "deviceAlias": "",
        "deviceIpRange": "",
        "searchMode": "ip",
        "x": 390,
        "y": 480,
        "wires": [
            [
                "c76158138c91c20f"
            ]
        ]
    },
    {
        "id": "086d3450b3d9dbd2",
        "type": "group",
        "z": "35250d14.0fb0b2",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "3404f36bd650ed10",
            "cdab8da9d33add5e",
            "94b3d0d0d8874cd5",
            "d2be7d3d82d57bab"
        ],
        "x": 714,
        "y": 199,
        "w": 632,
        "h": 142
    },
    {
        "id": "3404f36bd650ed10",
        "type": "debug",
        "z": "35250d14.0fb0b2",
        "g": "086d3450b3d9dbd2",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1230,
        "y": 300,
        "wires": []
    },
    {
        "id": "cdab8da9d33add5e",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "086d3450b3d9dbd2",
        "name": "",
        "props": [],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 850,
        "y": 300,
        "wires": [
            [
                "d2be7d3d82d57bab"
            ]
        ]
    },
    {
        "id": "94b3d0d0d8874cd5",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "086d3450b3d9dbd2",
        "name": "[node-status]",
        "info": "",
        "x": 810,
        "y": 240,
        "wires": []
    },
    {
        "id": "d2be7d3d82d57bab",
        "type": "tplink_status",
        "z": "35250d14.0fb0b2",
        "g": "086d3450b3d9dbd2",
        "name": "",
        "email": "your-email@gmail.com",
        "password": "password",
        "deviceIp": "",
        "deviceAlias": "",
        "deviceIpRange": "",
        "searchMode": "ip",
        "x": 1030,
        "y": 300,
        "wires": [
            [
                "3404f36bd650ed10"
            ]
        ]
    },
    {
        "id": "4a73621dbd59ed57",
        "type": "group",
        "z": "35250d14.0fb0b2",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "2705cf801d2ce67f",
            "652a90197f7e9fa8",
            "0d09174cf7cb7b57",
            "540ce7bb94fbee5b",
            "8a3bb671c9d1af16",
            "62493963889dc648",
            "b5424b08cd6f0b05",
            "68ac8d3c198d8364",
            "3f8eab24d64abe2a",
            "28a412c037bbab85",
            "d14bd2a50a0e9e13",
            "4731fb8d1424c9ab",
            "57aae3e37c7efdc8",
            "9615b09994d298e1",
            "7f00d365e09bff33"
        ],
        "x": 34,
        "y": 619,
        "w": 652,
        "h": 422
    },
    {
        "id": "2705cf801d2ce67f",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payloadType": "str",
        "x": 170,
        "y": 840,
        "wires": [
            [
                "d14bd2a50a0e9e13"
            ]
        ]
    },
    {
        "id": "652a90197f7e9fa8",
        "type": "debug",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 570,
        "y": 840,
        "wires": []
    },
    {
        "id": "0d09174cf7cb7b57",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payloadType": "str",
        "x": 170,
        "y": 760,
        "wires": [
            [
                "28a412c037bbab85"
            ]
        ]
    },
    {
        "id": "540ce7bb94fbee5b",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "tapo device infomation",
        "info": "",
        "x": 160,
        "y": 960,
        "wires": []
    },
    {
        "id": "8a3bb671c9d1af16",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "power on",
        "info": "",
        "x": 140,
        "y": 720,
        "wires": []
    },
    {
        "id": "62493963889dc648",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payloadType": "str",
        "x": 170,
        "y": 1000,
        "wires": [
            [
                "4731fb8d1424c9ab"
            ]
        ]
    },
    {
        "id": "b5424b08cd6f0b05",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "power off",
        "info": "",
        "x": 140,
        "y": 800,
        "wires": []
    },
    {
        "id": "68ac8d3c198d8364",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "[node-command]",
        "info": "",
        "x": 140,
        "y": 660,
        "wires": []
    },
    {
        "id": "3f8eab24d64abe2a",
        "type": "tplink_command",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "email": "your-email@gmail.com",
        "password": "password",
        "deviceIp": "192.168.0.100",
        "deviceAlias": "",
        "deviceIpRange": "",
        "searchMode": "ip",
        "x": 560,
        "y": 760,
        "wires": [
            [
                "652a90197f7e9fa8"
            ]
        ]
    },
    {
        "id": "28a412c037bbab85",
        "type": "template",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "field": "payload",
        "fieldType": "msg",
        "format": "json",
        "syntax": "plain",
        "template": "{\n    \"email\": \"your@gmail.com\",\n    \"password\": \"password\",\n    \"deviceIp\": \"192.168.0.123\",\n    \"searchMode\": \"ip\",\n    \"command\": \"power\",\n    \"option\": {\n        \"power\": 1\n    }\n}",
        "output": "json",
        "x": 340,
        "y": 760,
        "wires": [
            [
                "3f8eab24d64abe2a"
            ]
        ]
    },
    {
        "id": "d14bd2a50a0e9e13",
        "type": "template",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "field": "payload",
        "fieldType": "msg",
        "format": "json",
        "syntax": "plain",
        "template": "{\n    \"email\": \"your@gmail.com\",\n    \"password\": \"foo\",\n    \"deviceAlias\": \"bar\",\n    \"deviceIpRange\": \"192.168.0.0/24\",\n    \"searchMode\": \"alias\",\n    \"command\": \"power\",\n    \"option\": {\n        \"power\": 0\n    }\n}",
        "output": "json",
        "x": 340,
        "y": 840,
        "wires": [
            [
                "3f8eab24d64abe2a"
            ]
        ]
    },
    {
        "id": "4731fb8d1424c9ab",
        "type": "template",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "field": "payload",
        "fieldType": "msg",
        "format": "json",
        "syntax": "plain",
        "template": "{\n    \"command\": \"status\"\n}",
        "output": "json",
        "x": 340,
        "y": 1000,
        "wires": [
            [
                "3f8eab24d64abe2a"
            ]
        ]
    },
    {
        "id": "57aae3e37c7efdc8",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "power on/off(toggle)",
        "info": "",
        "x": 170,
        "y": 880,
        "wires": []
    },
    {
        "id": "9615b09994d298e1",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payloadType": "str",
        "x": 170,
        "y": 920,
        "wires": [
            [
                "7f00d365e09bff33"
            ]
        ]
    },
    {
        "id": "7f00d365e09bff33",
        "type": "template",
        "z": "35250d14.0fb0b2",
        "g": "4a73621dbd59ed57",
        "name": "",
        "field": "payload",
        "fieldType": "msg",
        "format": "json",
        "syntax": "plain",
        "template": "{\n    \"command\": \"toggle\"\n}",
        "output": "json",
        "x": 340,
        "y": 920,
        "wires": [
            [
                "3f8eab24d64abe2a"
            ]
        ]
    },
    {
        "id": "7b2634e685c20aa0",
        "type": "group",
        "z": "35250d14.0fb0b2",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "f5a5e8026b113f41",
            "72771d09395e2f3c",
            "a20995f2e443db2c",
            "1295d338c03939ee"
        ],
        "x": 34,
        "y": 199,
        "w": 652,
        "h": 142
    },
    {
        "id": "f5a5e8026b113f41",
        "type": "debug",
        "z": "35250d14.0fb0b2",
        "g": "7b2634e685c20aa0",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 570,
        "y": 300,
        "wires": []
    },
    {
        "id": "72771d09395e2f3c",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "7b2634e685c20aa0",
        "name": "",
        "props": [],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 190,
        "y": 300,
        "wires": [
            [
                "1295d338c03939ee"
            ]
        ]
    },
    {
        "id": "a20995f2e443db2c",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "7b2634e685c20aa0",
        "name": "[node-toggle]",
        "info": "",
        "x": 130,
        "y": 240,
        "wires": []
    },
    {
        "id": "1295d338c03939ee",
        "type": "tplink_toggle",
        "z": "35250d14.0fb0b2",
        "g": "7b2634e685c20aa0",
        "name": "",
        "email": "your-email@gmail.com",
        "password": "password",
        "deviceIp": "",
        "deviceAlias": "",
        "deviceIpRange": "",
        "searchMode": "ip",
        "x": 370,
        "y": 300,
        "wires": [
            [
                "f5a5e8026b113f41"
            ]
        ]
    },
    {
        "id": "b56635b3f132805e",
        "type": "group",
        "z": "35250d14.0fb0b2",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "2251f4edf4b86c68",
            "7b688ce95edf4463",
            "81b35f69d9d6d69d",
            "f4a4dfc5fd2ffaff",
            "0d28b02fa5bccdd6"
        ],
        "x": 714,
        "y": 379,
        "w": 632,
        "h": 202
    },
    {
        "id": "2251f4edf4b86c68",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "b56635b3f132805e",
        "name": "#cccccc",
        "props": [
            {
                "p": "colour",
                "v": "#cccccc",
                "vt": "str"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 850,
        "y": 540,
        "wires": [
            [
                "0d28b02fa5bccdd6"
            ]
        ]
    },
    {
        "id": "7b688ce95edf4463",
        "type": "debug",
        "z": "35250d14.0fb0b2",
        "g": "b56635b3f132805e",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1230,
        "y": 480,
        "wires": []
    },
    {
        "id": "81b35f69d9d6d69d",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "b56635b3f132805e",
        "name": "white",
        "props": [
            {
                "p": "colour",
                "v": "white",
                "vt": "str"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 850,
        "y": 480,
        "wires": [
            [
                "0d28b02fa5bccdd6"
            ]
        ]
    },
    {
        "id": "f4a4dfc5fd2ffaff",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "b56635b3f132805e",
        "name": "[node-colour]",
        "info": "",
        "x": 810,
        "y": 420,
        "wires": []
    },
    {
        "id": "0d28b02fa5bccdd6",
        "type": "tplink_colour",
        "z": "35250d14.0fb0b2",
        "g": "b56635b3f132805e",
        "name": "",
        "email": "your-email@gmail.com",
        "password": "password",
        "deviceIp": "",
        "deviceAlias": "",
        "deviceIpRange": "",
        "colour": "#000000",
        "searchMode": "ip",
        "x": 1030,
        "y": 480,
        "wires": [
            [
                "7b688ce95edf4463"
            ]
        ]
    },
    {
        "id": "d9911e3830e586ee",
        "type": "group",
        "z": "35250d14.0fb0b2",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "dff10f578aa5b66c",
            "a78a0795cccf664d",
            "ab92ef78b8813a7a",
            "2aa4613a0d8d09a9"
        ],
        "x": 714,
        "y": 19,
        "w": 632,
        "h": 142
    },
    {
        "id": "dff10f578aa5b66c",
        "type": "debug",
        "z": "35250d14.0fb0b2",
        "g": "d9911e3830e586ee",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1230,
        "y": 120,
        "wires": []
    },
    {
        "id": "a78a0795cccf664d",
        "type": "inject",
        "z": "35250d14.0fb0b2",
        "g": "d9911e3830e586ee",
        "name": "",
        "props": [],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 850,
        "y": 120,
        "wires": [
            [
                "2aa4613a0d8d09a9"
            ]
        ]
    },
    {
        "id": "ab92ef78b8813a7a",
        "type": "comment",
        "z": "35250d14.0fb0b2",
        "g": "d9911e3830e586ee",
        "name": "[node-turn-on]",
        "info": "",
        "x": 810,
        "y": 60,
        "wires": []
    },
    {
        "id": "2aa4613a0d8d09a9",
        "type": "tplink_turn_on",
        "z": "35250d14.0fb0b2",
        "g": "d9911e3830e586ee",
        "name": "",
        "email": "your-email@gmail.com",
        "password": "password",
        "deviceIp": "",
        "deviceAlias": "",
        "deviceIpRange": "",
        "searchMode": "ip",
        "x": 1040,
        "y": 120,
        "wires": [
            [
                "dff10f578aa5b66c"
            ]
        ]
    }
]
```

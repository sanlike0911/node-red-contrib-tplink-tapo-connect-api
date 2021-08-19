# node-red-contrib-tplink-tapo-connect-api

Unofficial node-RED node for connecting to TP-Link Tapo devices. Currently limited to the P100 & P105 smart plugs.

![node](./figs/sample00.png)

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

    set the email address registered with Tp Link.

  - Password

    set the password registered with Tp Link.

  - Tapo ip

    set the IP address to the Tapo device.

    *This setting chooses either `Tapo ip` or `Tapo alias and Ip Find ip rang`.

    *Priority: `(Tapo ip > Tapo alias)`

  - Tapo alias

    set the tapo device alias registered with Tp Link.

  - Find ip range

    set the IP range to search for Tapo device.

    [Usage]

    - case1: "192.168.0.1 to 192.168.0.25"

    - case2: "192.168.0.0/24"

- Inputs

    1) payload: numbar `*required`

        Set ON/OFF of the smart plug.
        Get device information in the option settings.

        ```text
          0: smart plug power off
          1: smart plug power on
        255: smart plug device infomation
        ```

- Outputs

    The processing result is passed by msg.payload. It consists of an object that contains the following properties:

    ```javascript
    type tapoConnectResults = {
        result: boolean; /* true: success, false: failure */
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

- example

    ```json
    [
        {
            "id": "b5e3d925d80b36ad",
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
                "fb493813.249f08",
                "8311f395.25e56",
                "2aa38c09.564724",
                "9158e6ef.dd5d78",
                "79f7a84a.4c4d88",
                "27568da0.cc1852",
                "3338a0f2585b9662",
                "f5ca83ef74c5c137"
            ],
            "x": 34,
            "y": 19,
            "w": 772,
            "h": 302
        },
        {
            "id": "fb493813.249f08",
            "type": "tplink_tapo_connect_api",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
            "name": "",
            "email": "your-email@gmail.com",
            "password": "password",
            "deviceIp": "192.168.0.120",
            "deviceAlias": "3d printer power supply",
            "deviceIpRange": "192.168.0.0/24",
            "x": 470,
            "y": 100,
            "wires": [
                [
                    "2aa38c09.564724"
                ]
            ]
        },
        {
            "id": "8311f395.25e56",
            "type": "inject",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
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
            "payload": "1",
            "payloadType": "num",
            "x": 210,
            "y": 180,
            "wires": [
                [
                    "fb493813.249f08"
                ]
            ]
        },
        {
            "id": "2aa38c09.564724",
            "type": "debug",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
            "name": "",
            "active": true,
            "tosidebar": true,
            "console": false,
            "tostatus": false,
            "complete": "false",
            "statusVal": "",
            "statusType": "auto",
            "x": 690,
            "y": 100,
            "wires": []
        },
        {
            "id": "9158e6ef.dd5d78",
            "type": "inject",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
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
            "payload": "0",
            "payloadType": "str",
            "x": 210,
            "y": 100,
            "wires": [
                [
                    "fb493813.249f08"
                ]
            ]
        },
        {
            "id": "79f7a84a.4c4d88",
            "type": "comment",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
            "name": "tapo device infomation",
            "info": "",
            "x": 160,
            "y": 240,
            "wires": []
        },
        {
            "id": "27568da0.cc1852",
            "type": "comment",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
            "name": "power off",
            "info": "",
            "x": 120,
            "y": 60,
            "wires": []
        },
        {
            "id": "3338a0f2585b9662",
            "type": "inject",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
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
            "payload": "255",
            "payloadType": "num",
            "x": 210,
            "y": 280,
            "wires": [
                [
                    "fb493813.249f08"
                ]
            ]
        },
        {
            "id": "f5ca83ef74c5c137",
            "type": "comment",
            "z": "35250d14.0fb0b2",
            "g": "b5e3d925d80b36ad",
            "name": "power on",
            "info": "",
            "x": 120,
            "y": 140,
            "wires": []
        }
    ]
    ```

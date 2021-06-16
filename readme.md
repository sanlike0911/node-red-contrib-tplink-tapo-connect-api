# node-red-contrib-tplink-tapo-connect-api

Unofficial node-RED node for connecting to TP-Link Tapo devices. Currently limited to the P105 smart plugs.

![node](./figs/sample00.png)

## Pre-requisites

The node-red-contrib-tplink-tapo-connect-api requires `Node-RED 1.00` to be installed.

## Install

This `node-red-contrib-tplink-tapo-connect-api` is implemented according to the `dickydoouk
/tp-link-tapo-connect` specification.

See "[dickydoouk/tp-link-tapo-connect](https://github.com/dickydoouk/tp-link-tapo-connect)" for details

```cmd
npm install node-red-contrib-tplink-tapo-connect-api
```

## Usage

- Properties

  ![config](./figs/sample01.png)

  - Name

    Set the node name displayed in the flow.

  - Email

    set the email address registered with Tp Link

  - Password

    set the password registered with Tp Link

  - Tapo ip

    set the IP address to the Tapo device.

    *This setting sets either `Tapo ip` or `Tapo alias and Ip Find ip rang`.

    *Priority: `(Tapo ip > Tapo alias)`

  - Tapo alias

    set the tapo device alias registered with Tp Link

  - Find ip range

    set the IP range to search for Tapo device.

    [Usage]

    - case1: "192.168.0.1 to 192.168.0.25"

    - case2: "192.168.0.0/24"

- Inputs

    1) payload: numbar `*required`

        set ON/OFF of the smart plug.

        ```json
        0: power off
        1: power on
        ```

- Outputs

    The processing result is passed by msg.payload. It consists of an object that contains the following properties:

    ```javascript
    type tapoConnectResults = {
        result: boolean; /* true: success, false: failure */
        errorInf?: Error;
    }
    ```

import find from 'local-devices'

export const resolveMacToIp = async (mac: string) :Promise<string> => {
    //@ts-ignore
    const devices = await find(null, true);
    let result : string = "";
    if(undefined !== devices) {
        result = devices.find(device => tidyMac(device!.mac) == tidyMac(mac)).ip;
    }
    return result;
}

const tidyMac = (mac: string): string => {
    return mac.replace(/:/g, '').toUpperCase();
}
/**
 * @file
 * This script gives the ip-from and ip-to in the given CIDR range 
 * When called with an extra IP it checks if this ip is in the range
 * usage:
 *   node getCIDRrange xxx.xxx.xxx/xx 
 *   node getCIDRrange xxx.xxx.xxx/xx  yyy.yyy.yyy.yyyy
 */
import ip from 'ip';

function getCIDRRange(cidr, checkOnIp = null) {
    const range = ip.cidrSubnet(cidr);
    const ipFrom = range.firstAddress;
    const ipTo = range.lastAddress;
    const ipInRange = checkOnIp ? range.contains(checkOnIp) : null;

    return { ipFrom, ipTo, ipInRange };
}

// Function to check if a string is in valid CIDR notation
function isValidCIDR(cidr) {
    // Regular expression to match CIDR format
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

    // Check if the CIDR matches the regular expression
    if (cidrRegex.test(cidr)) {
        // Further check each part of the IP to ensure values are within valid range
        const parts = cidr.split('/');
        const ipParts = parts[0].split('.').map(Number);
        const prefixLength = Number(parts[1]);

        // Ensure IP parts are within 0-255 and prefix length is within 0-32 for IPv4
        const isValidIP = ipParts.every(part => part >= 0 && part <= 255);
        const isValidPrefix = prefixLength >= 0 && prefixLength <= 32;

        return isValidIP && isValidPrefix;
    }

    return false;
}

function main() {
    const [cidr, checkOnIp] = process.argv.slice(2);

    if (!cidr||!isValidCIDR(cidr)) {
        console.error('Usage: node getCIDRrange <CIDR> [ip-to-check]');
        process.exit(1);
    }
    const { ipFrom, ipTo, ipInRange } = getCIDRRange(cidr, checkOnIp);

    console.log(`IP range for CIDR ${cidr}:`);
    console.log(`From    : ${ipFrom}`);
    console.log(`To      : ${ipTo}`);
    if (ipInRange !== null) {
        console.log(`\n${checkOnIp} is ${ipInRange ? '' : 'not '}in range\n`);
    }
}

main();
import ip from 'ip';

/* We exclude default the zero range, because everything is true in the zero range */ 
let excludeNul = true;  // exclude 0.0.0.0/0

/* But we offer the opportunity to include the zero range */
export function includeNul() {
    excludeNul = false;
}

// Function to check if a string is in valid CIDR notation
export function isValidCIDR(cidr) {
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

export function getCIDRRange(cidr, checkOnIp = null) {
    if (!isValidCIDR(cidr)) {
        return {};
    }
    const range = ip.cidrSubnet(cidr);
    const ipFrom = range.firstAddress;
    const ipTo = range.lastAddress;
    const ipInRange = checkOnIp ? range.contains(checkOnIp) : null;

    return { ipFrom, ipTo, ipInRange };
}

// Function to check if the IP is in a CIDR range
export function isIpInCIDR(ipAddress, cidr) {
    if (!isValidCIDR(cidr)) {
        return false;
    }
    if (excludeNul && cidr == "0.0.0.0/0") {
        return false;
    }
    // Utilize the existing logic from getCIDRRange to check if the IP is in range
    const { ipInRange } = getCIDRRange(cidr, ipAddress);
    return ipInRange;
}